import { Pagination as BSPagination } from 'react-bootstrap';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
}

/**
 * Pagination Component
 *
 * Displays pagination controls for navigating through multiple pages
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const rangeStart = Math.max(2, currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis before range if needed
      if (rangeStart > 2) {
        pages.push('ellipsis');
      }

      // Add pages in range
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (rangeEnd < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <BSPagination className="justify-content-center">
      <BSPagination.First
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      />
      <BSPagination.Prev
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />

      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return <BSPagination.Ellipsis key={`ellipsis-${index}`} disabled />;
        }

        return (
          <BSPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </BSPagination.Item>
        );
      })}

      <BSPagination.Next
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
      <BSPagination.Last
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      />
    </BSPagination>
  );
}

export default Pagination;
