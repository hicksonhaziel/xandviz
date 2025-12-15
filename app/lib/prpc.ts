import axios, { AxiosError } from 'axios';

/**
 * Parsed Pod (pNode) representation used by the frontend
 */
export interface PNode { 
  id: string;
  pubkey: string;
  version: string;
  status: 'active' | 'syncing' | 'offline';
  uptime: number;
  lastSeen: number;
  rpcPort: number;
  ipAddress: string;
  isPublic: boolean;
  storageCommitted: number;
  storageUsed: number;
  storageUsagePercent: number;
}

/**
 * RPC response shape
 */
interface PRPCResponse {
  jsonrpc: string;
  id: number;
  error?: any;
  result: {
    pods: any[];
  };
}

/**
 * Extended pNode with optional deep details
 */
export interface PNodeWithDetails extends PNode {
  private?: boolean;
  details?: any;
}

/**
 * pRPC Client
 */
class PRPCClient {
  private endpoint: string;
  private timeout: number = 5000; // 5s timeout for RPC calls
  private cache: Map<string, { data: PNode[]; timestamp: number }> = new Map();
  private cacheTTL: number = 30000; // 30s cache

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  /**
   * Fetch all pods with stats (with caching)
   */
  async getClusterNodes(): Promise<PNode[]> {
    const cached = this.cache.get('cluster');
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await axios.post<PRPCResponse>(
        this.endpoint,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'get-pods-with-stats',
          params: [],
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.error) {
        console.error('RPC error:', response.data.error);
        return [];
      }

      const pods = response.data?.result?.pods ?? [];
      const parsed = this.parsePNodes(pods);
      
      // Cache the result
      this.cache.set('cluster', { data: parsed, timestamp: Date.now() });
      
      return parsed;
    } catch (error) {
      this.handleRPCError('getClusterNodes', error);
      return [];
    }
  }

  /**
   * Fetch a specific pod by pubkey
   */
  async getPNodeInfo(pubkey: string): Promise<PNodeWithDetails | null> {
    const allPods = await this.getClusterNodes();
    const normalizedPubkey = pubkey.trim().toLowerCase();

    const pod = allPods.find(
      p => p.pubkey.trim().toLowerCase() === normalizedPubkey
    );

    if (!pod) {
      console.warn(`Pod not found: ${pubkey}`);
      return null;
    }

    // If pod is private, return basic info
    if (!pod.isPublic) {
      return {
        ...pod,
        private: true,
      };
    }

    // Pod is public → attempt to fetch deep info
    return this.fetchPublicPodDetails(pod);
  }

  /**
   * Fetch detailed info from a public pod's RPC endpoint
   */
  private async fetchPublicPodDetails(
    pod: PNode
  ): Promise<PNodeWithDetails> {
    // Validate IP and port
    if (!pod.ipAddress || !pod.rpcPort) {
      console.warn(`Invalid RPC info for pod ${pod.pubkey}`);
      return {
        ...pod,
        private: false,
        details: null,
      };
    }

    try {
      const rpcEndpoint = `http://${pod.ipAddress}:${pod.rpcPort}/rpc`;
      
      const response = await axios.post(
        rpcEndpoint,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'get-stats',
          params: [],
        },
        {
          timeout: 3000, // Shorter timeout for external calls
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500, // Accept 4xx responses
        }
      );

      return {
        ...pod,
        private: false,
        details: response.data,
      };
    } catch (error) {
      // Non-critical error - log and return basic info
      if (axios.isAxiosError(error)) {
        console.warn(
          `Failed to fetch details for ${pod.pubkey}: ${error.message}`
        );
      }
      
      return {
        ...pod,
        private: false,
        details: null,
      };
    }
  }

  /**
   * Parse list of raw pods
   */
  private parsePNodes(data: any[]): PNode[] {
    if (!Array.isArray(data)) {
      console.error('Invalid pods data: expected array');
      return [];
    }

    return data
      .map(pod => this.parsePNode(pod))
      .filter((p): p is PNode => p !== null);
  }

  /**
   * Parse a single raw pod from RPC
   */
  private parsePNode(data: any): PNode | null {
    try {
      // Validate required fields
      if (!data.pubkey) {
        console.warn('Pod missing pubkey, skipping');
        return null;
      }

      const [ip = ''] = (data.address || '').split(':');

      return {
        id: `pnode-${data.pubkey.slice(0, 8)}`,
        pubkey: data.pubkey,
        version: data.version || 'unknown',
        uptime: Math.max(0, data.uptime || 0),
        lastSeen: data.last_seen_timestamp
          ? data.last_seen_timestamp * 1000
          : Date.now(),
        status: this.determineStatus(data.last_seen_timestamp),
        rpcPort: Math.max(0, data.rpc_port || 0),
        ipAddress: ip,
        isPublic: Boolean(data.is_public),
        storageCommitted: Math.max(0, data.storage_committed || 0),
        storageUsed: Math.max(0, data.storage_used || 0),
        storageUsagePercent: Math.min(
          100,
          Math.max(0, data.storage_usage_percent || 0)
        ),
      };
    } catch (error) {
      console.error('Failed to parse pod:', error);
      return null;
    }
  }

  /**
   * Determine pod status from last-seen timestamp
   */
  private determineStatus(
    lastSeenSeconds?: number
  ): 'active' | 'syncing' | 'offline' {
    if (!lastSeenSeconds) return 'offline';

    const diffMs = Date.now() - lastSeenSeconds * 1000;

    if (diffMs < 60_000) return 'active'; // < 1 min
    if (diffMs < 300_000) return 'syncing'; // < 5 min
    return 'offline';
  }

  /**
   * Handle RPC errors consistently
   */
  private handleRPCError(method: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(`${method}: Connection refused to ${this.endpoint}`);
      } else if (axiosError.code === 'ETIMEDOUT') {
        console.error(`${method}: Request timeout to ${this.endpoint}`);
      } else {
        console.error(
          `${method}: ${axiosError.message}`,
          axiosError.response?.data
        );
      }
    } else {
      console.error(`${method}: Unknown error`, error);
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Export singleton client
 */
export const prpcClient = new PRPCClient(
  process.env.NEXT_PUBLIC_XANDEUM_RPC_ENDPOINT ||
    'http://173.212.203.145:6000/rpc'
);