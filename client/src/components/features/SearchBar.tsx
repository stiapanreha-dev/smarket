import { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BsSearch, BsClock, BsX } from 'react-icons/bs';
import { getAutocomplete, AutocompleteResponse } from '@/api/catalog.api';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import './SearchBar.css';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export const SearchBar = ({ onSearch, placeholder, className = '', defaultValue = '' }: SearchBarProps) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getAutocomplete(searchQuery, i18n.language);
      setSuggestions(response);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    addRecentSearch(trimmedQuery);
    setIsOpen(false);
    setSuggestions(null);
    setQuery('');

    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        return;
      }
      return;
    }

    const totalItems = getTotalItems();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const item = getItemByIndex(selectedIndex);
          if (item) {
            if (item.type === 'product' || item.type === 'service') {
              navigate(`/products/${item.id}`);
              setIsOpen(false);
            } else if (item.type === 'category') {
              handleSearch(item.value as string);
            } else if (item.type === 'recent') {
              handleSearch(item.value as string);
            }
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Get total items for keyboard navigation
  const getTotalItems = () => {
    let count = 0;
    if (query.length < 2 && recentSearches.length > 0) {
      count += recentSearches.length;
    }
    if (suggestions) {
      count += suggestions.products.length + suggestions.services.length + suggestions.categories.length;
    }
    count += 1; // "View all results" item
    return count;
  };

  // Get item by index for keyboard navigation
  const getItemByIndex = (index: number): any => {
    let currentIndex = 0;

    // Recent searches
    if (query.length < 2 && recentSearches.length > 0) {
      if (index < recentSearches.length) {
        return { type: 'recent', value: recentSearches[index] };
      }
      currentIndex += recentSearches.length;
    }

    if (suggestions) {
      // Products
      if (index < currentIndex + suggestions.products.length) {
        return { type: 'product', ...suggestions.products[index - currentIndex] };
      }
      currentIndex += suggestions.products.length;

      // Services
      if (index < currentIndex + suggestions.services.length) {
        return { type: 'service', ...suggestions.services[index - currentIndex] };
      }
      currentIndex += suggestions.services.length;

      // Categories
      if (index < currentIndex + suggestions.categories.length) {
        return { type: 'category', value: suggestions.categories[index - currentIndex] };
      }
    }

    return null;
  };

  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="search-highlight">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return `${(price / 100).toFixed(2)} ${currency}`;
  };

  const showSuggestions = query.length >= 2 && suggestions;
  const showRecent = query.length < 2 && recentSearches.length > 0;

  return (
    <div className={`search-bar-wrapper ${className}`} ref={searchRef}>
      <div className="search-input-wrapper">
        <BsSearch className="search-icon" />
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder={placeholder || 'Search products, services...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        {query && (
          <BsX
            className="clear-icon"
            onClick={() => {
              setQuery('');
              setSuggestions(null);
              inputRef.current?.focus();
            }}
          />
        )}
      </div>

      {isOpen && (showSuggestions || showRecent) && (
        <div className="search-dropdown">
          {isLoading && (
            <div className="search-dropdown-item text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && !isLoading && (
            <div className="search-section">
              <div className="search-section-header">
                <span>Recent Searches</span>
                <button className="clear-recent-btn" onClick={clearRecentSearches}>
                  Clear
                </button>
              </div>
              {recentSearches.map((recent, index) => (
                <div
                  key={recent}
                  className={`search-dropdown-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSearch(recent)}
                >
                  <BsClock className="recent-icon" />
                  <span>{recent}</span>
                  <BsX
                    className="remove-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(recent);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          {showSuggestions && !isLoading && suggestions.products.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">Products</div>
              {suggestions.products.map((product, index) => {
                const itemIndex = (showRecent ? recentSearches.length : 0) + index;
                return (
                  <div
                    key={product.id}
                    className={`search-dropdown-item ${selectedIndex === itemIndex ? 'selected' : ''}`}
                    onClick={() => {
                      navigate(`/products/${product.id}`);
                      setIsOpen(false);
                      addRecentSearch(query);
                    }}
                  >
                    {product.image_url && (
                      <img src={product.image_url} alt={product.title} className="item-image" />
                    )}
                    <div className="item-content">
                      <div className="item-title">{highlightText(product.title, query)}</div>
                      <div className="item-price">{formatPrice(product.price, product.currency)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Services */}
          {showSuggestions && !isLoading && suggestions.services.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">Services</div>
              {suggestions.services.map((service, index) => {
                const itemIndex =
                  (showRecent ? recentSearches.length : 0) + suggestions.products.length + index;
                return (
                  <div
                    key={service.id}
                    className={`search-dropdown-item ${selectedIndex === itemIndex ? 'selected' : ''}`}
                    onClick={() => {
                      navigate(`/products/${service.id}`);
                      setIsOpen(false);
                      addRecentSearch(query);
                    }}
                  >
                    {service.image_url && (
                      <img src={service.image_url} alt={service.title} className="item-image" />
                    )}
                    <div className="item-content">
                      <div className="item-title">{highlightText(service.title, query)}</div>
                      <div className="item-price">{formatPrice(service.price, service.currency)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Categories */}
          {showSuggestions && !isLoading && suggestions.categories.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">Categories</div>
              {suggestions.categories.map((category, index) => {
                const itemIndex =
                  (showRecent ? recentSearches.length : 0) +
                  suggestions.products.length +
                  suggestions.services.length +
                  index;
                return (
                  <div
                    key={category}
                    className={`search-dropdown-item ${selectedIndex === itemIndex ? 'selected' : ''}`}
                    onClick={() => handleSearch(category)}
                  >
                    <BsSearch className="category-icon" />
                    <span>{highlightText(category, query)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* View All Results */}
          {query.trim() && (
            <div
              className={`search-dropdown-item view-all ${selectedIndex === getTotalItems() - 1 ? 'selected' : ''}`}
              onClick={() => handleSearch()}
            >
              <BsSearch className="search-icon-small" />
              <span>View all results for "{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
