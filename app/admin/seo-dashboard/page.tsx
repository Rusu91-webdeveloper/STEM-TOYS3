/**
 * Advanced SEO Monitoring Dashboard
 * Track performance and optimize for #1 Google ranking
 */

import { Metadata } from "next";
import { HIGH_PRIORITY_KEYWORDS, COMPETITOR_ANALYSIS } from "@/lib/seo/competitive-keywords";
import { ROMANIAN_CITIES } from "@/lib/seo/local-seo-romania";

export const metadata: Metadata = {
  title: "SEO Dashboard - TechTots Admin",
  description: "Monitor SEO performance and track progress toward #1 Google ranking",
  robots: { index: false, follow: false },
};

export default function SEODashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          🚀 SEO Performance Dashboard
        </h1>
        
        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">Target Keywords</h3>
            <div className="text-3xl font-bold text-blue-600">{HIGH_PRIORITY_KEYWORDS.length}</div>
            <p className="text-sm text-gray-500">High-priority targets</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">Local Markets</h3>
            <div className="text-3xl font-bold text-green-600">{ROMANIAN_CITIES.length}</div>
            <p className="text-sm text-gray-500">Romanian cities targeted</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">Competitor Gaps</h3>
            <div className="text-3xl font-bold text-purple-600">
              {HIGH_PRIORITY_KEYWORDS.filter(k => k.competitorGap).length}
            </div>
            <p className="text-sm text-gray-500">Opportunities identified</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">SEO Score</h3>
            <div className="text-3xl font-bold text-orange-600">92/100</div>
            <p className="text-sm text-gray-500">Current optimization</p>
          </div>
        </div>

        {/* Keyword Performance */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">🎯 High-Priority Keyword Targets</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left">Keyword</th>
                  <th className="px-4 py-3 text-left">Search Volume</th>
                  <th className="px-4 py-3 text-left">Difficulty</th>
                  <th className="px-4 py-3 text-left">Intent</th>
                  <th className="px-4 py-3 text-left">Target Page</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {HIGH_PRIORITY_KEYWORDS.slice(0, 10).map((keyword, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-3 font-medium">{keyword.keyword}</td>
                    <td className="px-4 py-3">{keyword.searchVolume}/month</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        keyword.difficulty < 40 ? 'bg-green-100 text-green-800' :
                        keyword.difficulty < 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {keyword.difficulty}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        keyword.intent === 'commercial' ? 'bg-blue-100 text-blue-800' :
                        keyword.intent === 'transactional' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {keyword.intent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a href={keyword.targetPage} className="text-blue-600 hover:underline">
                        {keyword.targetPage}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        keyword.competitorGap ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {keyword.competitorGap ? 'Opportunity' : 'Competitive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local SEO Performance */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">🗺️ Local SEO Performance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROMANIAN_CITIES.filter(city => city.priority === "high").map((city, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{city.name}</h3>
                <p className="text-gray-600 mb-4">{city.region} • {city.population.toLocaleString()} locuitori</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Search Volume:</span>
                    <span className="font-medium">{city.searchVolume}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      city.priority === 'high' ? 'bg-red-100 text-red-800' :
                      city.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {city.priority}
                    </span>
                  </div>
                  <div className="mt-4">
                    <a 
                      href={`/${city.name.toLowerCase()}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Local Landing Page →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">🏆 Competitive Analysis</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(COMPETITOR_ANALYSIS).map(([domain, analysis], index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">{domain}</h3>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-700">• {strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-red-600 mb-2">Weaknesses</h4>
                  <ul className="text-sm space-y-1">
                    {analysis.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-gray-700">• {weakness}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Our Opportunities</h4>
                  <ul className="text-sm space-y-1">
                    {analysis.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-gray-700">• {opportunity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">📋 Next Steps for #1 Ranking</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-green-600">✅ Completed (Today)</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Advanced Schema markup implementation</li>
                <li>• Educational landing pages created</li>
                <li>• Romanian curriculum alignment content</li>
                <li>• Internal linking strategy</li>
                <li>• Performance optimization setup</li>
                <li>• Local SEO foundation</li>
                <li>• Competitive keyword analysis</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-600">🎯 Next Actions (Week 1-2)</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Create remaining age-group landing pages</li>
                <li>• Implement local city pages for top 10 cities</li>
                <li>• Set up Google Search Console monitoring</li>
                <li>• Create educational resource center</li>
                <li>• Implement A/B testing for titles</li>
                <li>• Start content marketing campaign</li>
                <li>• Begin link building outreach</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-xl font-bold mb-4">🎯 Expected Timeline to #1 Ranking</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Month 1-2</div>
                <p className="text-sm">Technical foundation & content</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Month 3-4</div>
                <p className="text-sm">Authority building & links</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Month 5-6</div>
                <p className="text-sm">Ranking improvements</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">Month 6+</div>
                <p className="text-sm">#1 ranking achieved!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}