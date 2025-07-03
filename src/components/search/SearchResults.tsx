
import { useNavigate } from "react-router-dom";
import { SearchResultItem } from "@/services/search/searchService";
import { Calendar, Package, Users2, Briefcase, UserRound, Clock } from "lucide-react";
import { format } from "date-fns";

interface SearchResultsProps {
  results: {
    inventory: SearchResultItem[];
    events: SearchResultItem[];
    projects: SearchResultItem[];
    team: SearchResultItem[];
    patients: SearchResultItem[];
  };
  onItemClick: () => void;
  isLoading: boolean;
}

export const SearchResults = ({ results, onItemClick, isLoading }: SearchResultsProps) => {
  const navigate = useNavigate();
  
  const handleItemClick = (item: SearchResultItem) => {
    navigate(item.link);
    onItemClick();
  };

  const allResults = [
    ...results.inventory,
    ...results.events,
    ...results.projects,
    ...results.team,
    ...results.patients
  ];

  const hasResults = allResults.length > 0;
  const totalResults = allResults.length;

  if (isLoading) {
    return (
      <div className="py-6 px-4 text-sm text-muted-foreground flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-3"></div>
        <div>
          <p className="font-medium">Searching...</p>
          <p className="text-xs text-gray-400 mt-1">Please wait while we find results</p>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">No results found</p>
        <p className="text-xs text-gray-400">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
      {/* Results header */}
      <div className="py-3 px-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </p>
      </div>

      {results.patients.length > 0 && (
        <div>
          <div className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-cyan-50/50 to-transparent border-b border-cyan-100/30 flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 text-cyan-500" />
            Patients ({results.patients.length})
          </div>
          {results.patients.map((item) => (
            <div
              key={item.id}
              className="py-3 px-4 hover:bg-gradient-to-r hover:from-cyan-50/70 hover:to-transparent cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-cyan-300"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-cyan-100 mt-0.5">
                  <UserRound className="h-3.5 w-3.5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.projects.length > 0 && (
        <div>
          <div className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100/30 flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-blue-500" />
            Projects ({results.projects.length})
          </div>
          {results.projects.map((item) => (
            <div
              key={item.id}
              className="py-3 px-4 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-transparent cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-blue-300"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-blue-100 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.inventory.length > 0 && (
        <div>
          <div className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-purple-50/50 to-transparent border-b border-purple-100/30 flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-purple-500" />
            Inventory ({results.inventory.length})
          </div>
          {results.inventory.map((item) => (
            <div
              key={item.id}
              className="py-3 px-4 hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-transparent cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-purple-300"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-purple-100 mt-0.5">
                  <Package className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.events.length > 0 && (
        <div>
          <div className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-teal-50/50 to-transparent border-b border-teal-100/30 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-teal-500" />
            Events ({results.events.length})
          </div>
          {results.events.map((item) => (
            <div
              key={item.id}
              className="py-3 px-4 hover:bg-gradient-to-r hover:from-teal-50/70 hover:to-transparent cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-teal-300"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-teal-100 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {item.date && (
                      <p>{format(new Date(item.date), "MMM d, yyyy")}</p>
                    )}
                    {item.description && (
                      <p className="line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.team.length > 0 && (
        <div>
          <div className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gradient-to-r from-amber-50/50 to-transparent border-b border-amber-100/30 flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5 text-amber-500" />
            Team Members ({results.team.length})
          </div>
          {results.team.map((item) => (
            <div
              key={item.id}
              className="py-3 px-4 hover:bg-gradient-to-r hover:from-amber-50/70 hover:to-transparent cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-amber-300"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-amber-100 mt-0.5">
                  <Users2 className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with helpful tip */}
      <div className="py-3 px-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/30 to-transparent">
        <p className="text-xs text-gray-400 text-center">
          💡 Tip: Use <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border">Ctrl+K</kbd> to quickly open search
        </p>
      </div>
    </div>
  );
};
