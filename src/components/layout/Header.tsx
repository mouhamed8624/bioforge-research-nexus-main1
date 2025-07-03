import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { searchAll } from "@/services/search/searchService";
import { SearchResults } from "@/components/search/SearchResults";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

export function Header() {
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search functionality
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search', debouncedSearchQuery],
    queryFn: () => searchAll(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length >= 1,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fix for search input - maintain focus on input when typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Only open popover when we have enough characters
    if (value.length >= 2) {
      setIsSearchOpen(true);
    } else if (value.length === 0) {
      setIsSearchOpen(false);
    }
  };

  const handleSearchResultClick = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  // Focus input when clicking on search container
  const handleSearchContainerClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle focus and blur events
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery.length >= 2) {
      setIsSearchOpen(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay blur to allow clicks on search results
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && isSearchFocused) {
        handleClearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  useEffect(() => {
    // Set light theme by default
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  return (
    <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-gradient-to-r from-white to-cigass-50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      {/* Logo Section */}
      <div className="flex items-center">
        <img 
          src="/cigass-logo.png" 
          alt="CIGASS" 
          className="h-10 w-auto mr-6"
        />
      </div>
      
      {/* Right Section - can be expanded for user menu, notifications, etc. */}
      <div className="flex items-center">
        {/* Placeholder for future features like user menu */}
      </div>
    </header>
  );
}
