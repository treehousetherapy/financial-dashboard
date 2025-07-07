# Treehouse Financial Dashboard

A comprehensive financial analysis and forecasting dashboard for Treehouse Therapy Center LLC.

## Features

- **Real-time Financial Metrics**: Track active clients, monthly hours, revenue, and profit
- **Client Management**: Add, edit, and manage client information and hours
- **Financial Forecasting**: Project future performance with customizable assumptions
- **Scenario Analysis**: Analyze what-if scenarios for business decisions
- **Break-even Analysis**: Calculate break-even points and safety margins
- **Data Export**: Export financial data as JSON for further analysis

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Clone or download this project
3. Open terminal/command prompt in the project directory
4. Run: `npm install`
5. Run: `npm start`

The application will open in your browser at `http://localhost:3000`

## Cloud Deployment Options

### Option 1: Vercel (Recommended - Free)

1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. In project directory, run: `vercel`
4. Follow prompts to deploy

### Option 2: Netlify (Free)

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the `build` folder to Netlify dashboard
3. Or connect GitHub repository for automatic deployments

### Option 3: GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts: `"deploy": "gh-pages -d build"`
3. Run: `npm run build && npm run deploy`

### Option 4: AWS S3 + CloudFront

1. Build the project: `npm run build`
2. Upload `build` folder contents to S3 bucket
3. Configure CloudFront distribution

## Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized files ready for deployment.

## Project Structure

```
treehouse-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── TreehouseFinancialDashboard.js
│   ├── App.js
│   ├── index.js
│   ├── App.css
│   └── index.css
├── package.json
└── README.md
```

## Usage

1. **View Mode**: See current financial metrics and forecasts
2. **Edit Mode**: Click "Edit Mode" to modify:
   - Client information and hours
   - Service rates and costs
   - Growth assumptions
   - Forecast parameters
3. **Export Data**: Click "Export Data" to download financial analysis as JSON

## Key Metrics Calculated

- **Revenue**: Based on service hours and rates
- **Expenses**: Staff costs plus overhead
- **Profit Margin**: Net profit as percentage of revenue
- **Break-even Point**: Minimum hours needed to cover fixed costs
- **Utilization Rate**: Percentage of available hours being used

## Customization

The dashboard is fully customizable. You can modify:
- Service rates and distributions
- Staff costs and overhead
- Growth assumptions
- Forecast periods
- Client data

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software for Treehouse Therapy Center LLC.
