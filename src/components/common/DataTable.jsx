import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable Component
 * Reusable table with search, pagination, and sorting
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions [{key, label, render, className}]
 * @param {Array} props.data - Array of data objects
 * @param {boolean} props.searchable - Enable search functionality
 * @param {boolean} props.pagination - Enable pagination
 * @param {number} props.itemsPerPage - Items per page
 * @param {function} props.onRowClick - Callback when row is clicked
 */
const DataTable = ({
  columns,
  data,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  onRowClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = searchable
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = pagination ? filteredData.slice(startIndex, endIndex) : filteredData;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle keyboard navigation for table rows
  const handleKeyDown = (e, row) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick && onRowClick(row);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Search */}
      {searchable && (
        <div className='flex items-center space-x-2'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className='pl-10'
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className='rounded-md border overflow-hidden shadow-sm' role='region' aria-label='Data table'>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.className}
                  scope='col'
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-center py-12 text-gray-500'
                  role='cell'
                >
                  <div className='flex flex-col items-center gap-2'>
                    <Search className='h-8 w-8 text-gray-300' aria-hidden='true' />
                    <span className='text-base font-medium'>
                      {searchQuery ? 'No results found' : 'No data available'}
                    </span>
                    {searchQuery && (
                      <span className='text-sm text-gray-400'>
                        Try adjusting your search terms
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  className={onRowClick ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                  onKeyDown={(e) => handleKeyDown(e, row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-label={`View details for ${row.name || `row ${index + 1}`}`}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.className}
                      role='cell'
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg'>
            <span className='font-medium'>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{' '}
              {filteredData.length} results
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label='Previous page'
              className='min-w-[100px]'
            >
              <ChevronLeft className='h-4 w-4 mr-1' aria-hidden='true' />
              <span className='hidden sm:inline'>Previous</span>
            </Button>
            <div className='flex items-center px-4 py-2 bg-blue-50 text-blue-900 rounded-lg text-sm font-medium'>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label='Next page'
              className='min-w-[100px]'
            >
              <span className='hidden sm:inline'>Next</span>
              <ChevronRight className='h-4 w-4 ml-1' aria-hidden='true' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
