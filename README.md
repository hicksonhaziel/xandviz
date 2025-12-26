#Xandria - Advanced Xandeum pNode Analytics Platform

![XandViz Banner](https://xandria-eight.vercel.app/xandria.png)

> **Submission for:** Xandeum pNode Analytics Platform Bounty  
> **Built by:** Hickson Haziel 
> **Live Demo:** [https://xandria-eight.vercel.app/](https://xandria-eight.vercel.app/)  

---

## 🎯 Overview

Xandria is a next-generation analytics platform for Xandeum pNodes that goes beyond basic data display to provide actionable insights, network health monitoring, and operator tools. Built with modern web technologies and a focus on user experience, Xandria helps operators make informed decisions about pNode performance and network participation.

### ✨ Key Features

#### **Core Functionality**
- Real-time pNode discovery via gossip protocol
- Comprehensive pNode information display
- Advanced search, filter, and sort capabilities
- Live data updates via Redis
- Historical data

#### **Unique Innovations**
- **XandScore™** - Proprietary performance scoring algorithm (0-100 scale)
- **3D Network Topology** - Interactive visualization of pNode network
- **Predictive Analytics** - Performance trends and forecasting
- **Operator Dashboard** - Personalized insights and recommendations
- **Public API** - RESTful API for ecosystem integration
- **AI** - AI Analysis

#### **User Experience**
- Modern glassmorphism design
- Dark/Light mode with smooth transitions
- Fully responsive (mobile, tablet, desktop)
- Optimized performance (<2s load time)
- Accessible (WCAG 2.1 compliant)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (React 18, App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Recharts for data visualization
- Three.js for 3D graphics

**Backend:**
- Next.js API routes
- Uptash Redis for real-time updates
- Axios for HTTP requests

**Deployment:**
- Vercel (serverless)
- Automatic CI/CD
- Edge caching

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard │  │ 3D Topology  │  │  API Docs    │       │
│  └────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            React Query (State Management)              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  API Routes  │  │  pRPC Client │  │  Scoring     │    │
│  │  (/api/*)    │  │  (lib/prpc)  │  │  Engine      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Xandeum Network (DevNet)                    │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │  Gossip Protocol   │◄──────►│    pRPC Endpoint   │      │
│  └────────────────────┘        └────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- A Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/hicksonhaziel/xandria.git
cd xandria

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Xandeum endpoints

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.


## 📖 Usage Guide

### For pNode Operators

1. **Monitor Your pNode**
   - Search for your pNode by ID or pubkey
   - View real-time performance metrics
   - Check your XandScore™ and grade
   - And data history

2. **Compare Performance**
   - See how you rank against network average
   - Identify areas for improvement
   - Track historical performance trends

3. **Network Insights**
   - View geographic distribution
   - Check version adoption rates
   - Monitor network health

### For Researchers/Developers

1. **Network Analysis**
   - Export data in CSV/JSON format
   - Access public API endpoints
   - Visualize network topology in 3D

2. **API Integration**
   ```bash
   # Get all pNodes
   curl https://xandria-eight.vercel.app/api/pnodes
   
   # Get specific pNode
   curl https://xandria-eight.vercel.app/api/pnodes/[pubkey]
   
   # Get pNode score
   curl https://https://xandria-eight.vercel.app//api/xandscore
   ```

---

## 🎨 Features Deep Dive

### XandScore™ Algorithm

The XandScore™ is a proprietary scoring system (0-100) that evaluates pNode performance across five key metrics:

**Scoring Components:**
1. **Uptime (30%)** - Availability over time
2. **Response Time (25%)** - Speed of pRPC responses
3. **Storage Capacity (20%)** - Total available storage
4. **Version Currency (15%)** - Running latest software
5. **Network Reliability (10%)** - Consistency in gossip

**Grade Scale:**
- A+ (95-100): Exceptional
- A (90-94): Excellent
- B+ (85-89): Very Good
- B (80-84): Good
- C+ (75-79): Average
- C (70-74): Below Average
- D (60-69): Poor
- F (<60): Failing

### 3D Network Visualization

Interactive Three.js-powered visualization showing:
- Real-time pNode positions
- Gossip protocol connections
- Color-coded performance status
- Automatic rotation (pauses on interaction)
- Click to inspect individual nodes

**Controls:**
- **Mouse Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Click Node**: View details
- **Double Click**: Focus on node

### Real-Time Updates

Xandria maintains WebSocket connection to gossip protocol for:
- Live pNode status changes
- Performance metric updates
- Network events
- Connection changes

Update frequency: Every 5 seconds

---

## 🔌 API Documentation

### Base URL
```
https://https://xandria-eight.vercel.app/api
```



## 📦 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all required variables

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Alternative: Docker

```bash
# Build image
docker build -t xandviz .

# Run container
docker run -p 3000:3000 xandviz
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass before submitting PR

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Xandeum Labs** - For creating the pNode network and hosting this bounty
- **Solana Community** - For inspiration from validator dashboards
- **Open Source Community** - For the amazing tools and libraries

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/hicksonhaziel/xandria/issues)
- **Discord**: Join [Xandeum Discord](https://discord.gg/uqRSmmM5m)
- **Email**: your.email@example.com
- **Twitter**: [@yourhandle](https://twitter.com/devhickson)

---

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core pNode display
- [x] XandScore™ algorithm
- [x] 3D visualization
- [x] Real-time updates

### Phase 2 (Next 2 weeks)
- [ ] Historical data tracking
- [ ] Performance predictions
- [ ] Alert system for operators
- [ ] Mobile app (React Native)

### Phase 3 (1 month)
- [ ] Staking integration
- [ ] Reward calculator
- [ ] Network governance insights
- [ ] Advanced analytics

---



---

**Built with ❤️ for the Xandeum Community**

*"Visualizing the future of decentralized storage, one pNode at a time."*
