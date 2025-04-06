import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { Card, Tabs, Empty, Spin } from 'antd';
import { Building, Home, Files } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'unit' | 'project' | 'building';
  id: number;
  title: string;
  description: string;
  status?: string;
  link: string;
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    units: SearchResult[];
    projects: SearchResult[];
    buildings: SearchResult[];
  }>({
    units: [],
    projects: [],
    buildings: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const renderResultCard = (result: SearchResult) => (
    <Card
      key={`${result.type}-${result.id}`}
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(result.link)}
    >
      <div className="flex items-start space-x-4 rtl:space-x-reverse">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{result.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{result.description}</p>
          {result.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
              {result.status}
            </span>
          )}
        </div>
      </div>
    </Card>
  );

  const items = [
    {
      key: 'units',
      label: (
        <span className="flex items-center">
          <Home className="ml-2 h-4 w-4" />
          الوحدات ({results.units.length})
        </span>
      ),
      children: (
        <div>
          {results.units.length > 0 ? (
            results.units.map(renderResultCard)
          ) : (
            <Empty description="لا توجد نتائج" />
          )}
        </div>
      ),
    },
    {
      key: 'projects',
      label: (
        <span className="flex items-center">
          <Files className="ml-2 h-4 w-4" />
          المشاريع ({results.projects.length})
        </span>
      ),
      children: (
        <div>
          {results.projects.length > 0 ? (
            results.projects.map(renderResultCard)
          ) : (
            <Empty description="لا توجد نتائج" />
          )}
        </div>
      ),
    },
    {
      key: 'buildings',
      label: (
        <span className="flex items-center">
          <Building className="ml-2 h-4 w-4" />
          المباني ({results.buildings.length})
        </span>
      ),
      children: (
        <div>
          {results.buildings.length > 0 ? (
            results.buildings.map(renderResultCard)
          ) : (
            <Empty description="لا توجد نتائج" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">نتائج البحث عن: {query}</h1>
        <p className="text-gray-500 mt-2">
          {loading
            ? 'جاري البحث...'
            : `تم العثور على ${results.units.length + results.projects.length + results.buildings.length} نتيجة`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Tabs items={items} className="bg-white rounded-lg shadow p-6" />
      )}
    </div>
  );
};

export default SearchResults;