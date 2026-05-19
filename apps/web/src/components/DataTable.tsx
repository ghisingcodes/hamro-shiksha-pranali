import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Box } from '@mantine/core';

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  isLoading?: boolean;
}

export function DataTable<TData>({ table, isLoading }: DataTableProps<TData>) {
  return (
    <Box style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e9ecef', backgroundColor: '#ffffff' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ backgroundColor: '#f8f9fa' }}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#1e293b', // dark slate
                    borderBottom: '2px solid #e9ecef',
                    textAlign: 'left',
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={table.getAllColumns().length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading...
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllColumns().length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No data found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                style={{
                  transition: 'background-color 0.2s ease',
                  backgroundColor: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e6f0ff'; // light blue
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: '#1e293b', // dark slate
                      borderBottom: '1px solid #e9ecef',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Box>
  );
}