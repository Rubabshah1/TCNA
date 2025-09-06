// import React, { useState } from "react";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { ScrollArea } from "@/components/ui/scroll-area";

// interface DataTableProps<T> {
//   data: T[];
//   columns: {
//     key: keyof T | string;
//     header: string;
//     render?: (value: any, row: T) => React.ReactNode;
//     sortable?: boolean;
//   }[];
//   defaultSortKey?: keyof T | string;
//   defaultSortOrder?: "asc" | "desc";
//   onRowClick?: (row: T) => void;
//   className?: string;
//   scrollHeight?: string;
//   stickyHeader?: boolean;
// }

// export const DataTable = <T extends Record<string, any>>({
//   data,
//   columns,
//   defaultSortKey,
//   defaultSortOrder = "asc",
//   onRowClick,
//   className = "",
//   scrollHeight = "400px",
//   stickyHeader = true,
// }: DataTableProps<T>) => {
//   const [sortKey, setSortKey] = useState<keyof T | string | undefined>(defaultSortKey);
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

//   const handleSort = (key: keyof T | string) => {
//     if (sortKey === key) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortKey(key);
//       setSortOrder("asc");
//     }
//   };

//   const sortedData = [...data].sort((a, b) => {
//     if (!sortKey) return 0;
//     const aValue = a[sortKey];
//     const bValue = b[sortKey];
    
//     if (typeof aValue === "number" && typeof bValue === "number") {
//       return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
//     }
    
//     return sortOrder === "asc"
//       ? String(aValue).localeCompare(String(bValue))
//       : String(bValue).localeCompare(String(aValue));
//   });

//   return (
//     // <ScrollArea className={`max-h-[500px] overflow-x-auto overflow-y-auto ${className}`}>
//     //   <Table className="min-h-0 mb-0">
//     //     <TableHeader className={stickyHeader ? "sticky top-0 bg-white z-10" : ""}>
//     //       <TableRow>
//     //         {columns.map((column) => (
//     //           <TableHead
//     //             key={String(column.key)}
//     //             className={`text-blue-700 ${column.sortable ? "cursor-pointer" : ""}`}
//     //             onClick={() => column.sortable && handleSort(column.key)}
//     //           >
//     //             {column.header}
//     //             {column.sortable && sortKey === column.key && (
//     //               <span className="ml-1">
//     //                 {sortOrder === "asc" ? "↑" : "↓"}
//     //               </span>
//     //             )}
//     //           </TableHead>
//     //         ))}
//     //       </TableRow>
//     //     </TableHeader>
//     //     <TableBody>
//     //       {sortedData.map((row, idx) => (
//     //         <TableRow
//     //           key={idx}
//     //           className={onRowClick ? "cursor-pointer hover:bg-blue-50" : ""}
//     //           onClick={() => onRowClick?.(row)}
//     //         >
//     //           {columns.map((column) => (
//     //             <TableCell
//     //               key={String(column.key)}
//     //               className={column.key === "gene" ? "font-medium" : ""}
//     //             >
//     //               {column.render
//     //                 ? column.render(row[column.key], row)
//     //                 : row[column.key]}
//     //             </TableCell>
//     //           ))}
//     //         </TableRow>
//     //       ))}
//     //     </TableBody>
//     //   </Table>
//     // </ScrollArea>
//     <ScrollArea
//   className={`max-h-[500px] overflow-x-auto overflow-y-auto ${className}`}
//   style={{ maxWidth: "100%" }}
// >
//   <Table className="min-h-0 mb-0 ">
//     <TableHeader className={stickyHeader ? "sticky top-0 bg-white z-10" : ""}>
//       <TableRow>
//         {columns.map((column) => (
//           <TableHead
//             key={String(column.key)}
//             className={`text-blue-700 ${column.sortable ? "cursor-pointer" : ""}`}
//             onClick={() => column.sortable && handleSort(column.key)}
//           >
//             {column.header}
//             {column.sortable && sortKey === column.key && (
//               <span className="ml-1">
//                 {sortOrder === "asc" ? "↑" : "↓"}
//               </span>
//             )}
//           </TableHead>
//         ))}
//       </TableRow>
//     </TableHeader>
//     <TableBody>
//       {sortedData.map((row, idx) => (
//         <TableRow
//           key={idx}
//           className={onRowClick ? "cursor-pointer hover:bg-blue-50" : ""}
//           onClick={() => onRowClick?.(row)}
//         >
//           {columns.map((column) => (
//             <TableCell
//               key={String(column.key)}
//               className={column.key === "gene" ? "font-medium" : ""}
//             >
//               {column.render
//                 ? column.render(row[column.key], row)
//                 : row[column.key]}
//             </TableCell>
//           ))}
//         </TableRow>
//       ))}
//     </TableBody>
//   </Table>
// </ScrollArea>

//   );
// };
// import React, { useState } from "react";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Button } from "@/components/ui/button"; // Assuming you have a Button component

// interface DataTableProps<T> {
//   data: T[];
//   columns: {
//     key: keyof T | string;
//     header: string;
//     render?: (value: any, row: T) => React.ReactNode;
//     sortable?: boolean;
//   }[];
//   defaultSortKey?: keyof T | string;
//   defaultSortOrder?: "asc" | "desc";
//   onRowClick?: (row: T) => void;
//   className?: string;
//   scrollHeight?: string;
//   stickyHeader?: boolean;
//   showDownloadButtons?: boolean; // New optional prop
//   containerWidth?: string | number;
// }

// export const DataTable = <T extends Record<string, any>>({
//   data,
//   columns,
//   defaultSortKey,
//   defaultSortOrder = "asc",
//   onRowClick,
//   className = "",
//   scrollHeight = "400px",
//   stickyHeader = true,
//   showDownloadButtons = false,
//   containerWidth = "900px"
// }: DataTableProps<T>) => {
//   const [sortKey, setSortKey] = useState<keyof T | string | undefined>(defaultSortKey);
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

//   const handleSort = (key: keyof T | string) => {
//     if (sortKey === key) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortKey(key);
//       setSortOrder("asc");
//     }
//   };

//   const sortedData = [...data].sort((a, b) => {
//     if (!sortKey) return 0;
//     const aValue = a[sortKey];
//     const bValue = b[sortKey];
    
//     if (typeof aValue === "number" && typeof bValue === "number") {
//       return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
//     }
    
//     return sortOrder === "asc"
//       ? String(aValue).localeCompare(String(bValue))
//       : String(bValue).localeCompare(String(aValue));
//   });

//   // Function to convert data to CSV
//   const convertToCSV = (data: T[]) => {
//     const headers = columns.map(col => col.header).join(",");
//     const rows = data.map(row =>
//       columns.map(col => {
//         const value = row[col.key];
//         return `"${String(value).replace(/"/g, '""')}"`; // Handle quotes in CSV
//       }).join(",")
//     );
//     return [headers, ...rows].join("\n");
//   };

//   // Function to download CSV
//   const downloadCSV = () => {
//     const csv = convertToCSV(sortedData);
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "table_data.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   // Function to download JSON
//   const downloadJSON = () => {
//     const json = JSON.stringify(sortedData, null, 2);
//     const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "table_data.json");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="relative">
//       {showDownloadButtons && (
//       <div className="flex justify-end mb-2 gap-2">
//         <Button
//           size="sm"
//           variant="outline"
//           className="h-6 px-2 text-xs"
//           onClick={downloadCSV}
//          >
//           Download CSV
//         </Button>
//       </div>
// )}
//       {/* <ScrollArea
//   className={` max-h-[500px] overflow-x-auto scroll whitespace-nowrap scroll-smooth overflow-y-auto ${className}`}
//   style={{ maxWidth: "100%" }}
// >
//   <Table className="min-h-0 mb-0 ">
//           <TableHeader className={stickyHeader ? "sticky top-0 bg-white z-10" : ""}>
//             <TableRow>
//               {columns.map((column) => (
//                 <TableHead
//                   key={String(column.key)}
//                   className={`text-blue-700 ${column.sortable ? "cursor-pointer" : ""}`}
//                   onClick={() => column.sortable && handleSort(column.key)}
//                 >
//                   {column.header}
//                   {column.sortable && sortKey === column.key && (
//                     <span className="ml-1">
//                       {sortOrder === "asc" ? "↑" : "↓"}
//                     </span>
//                   )}
//                 </TableHead>
//               ))}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {sortedData.map((row, idx) => (
//               <TableRow
//                 key={idx}
//                 className={onRowClick ? "cursor-pointer hover:bg-blue-50" : ""}
//                 onClick={() => onRowClick?.(row)}
//               >
//                 {columns.map((column) => (
//                   <TableCell
//                     key={String(column.key)}
//                     className={column.key === "gene" ? "font-medium" : ""}
//                   >
//                     {column.render
//                       ? column.render(row[column.key], row)
//                       : row[column.key]}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </ScrollArea> */}
//       <div
//   className={`relative ${className}`}
//   style={{ maxHeight: scrollHeight, width: containerWidth, overflowY: "auto", overflowX: "auto" }}
// >
//   <Table className="min-w-[500px]">
//     <TableHeader>
//       <TableRow>
//         {columns.map((column) => (
//           <TableHead
//             key={String(column.key)}
//             className={`text-blue-700 bg-white z-20
//                        ${column.sortable ? "cursor-pointer" : ""}
//                        ${stickyHeader ? "sticky top-0" : ""}`} // 👈 works now
//             onClick={() => column.sortable && handleSort(column.key)}
//           >
//             {column.header}
//             {column.sortable && sortKey === column.key && (
//               <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
//             )}
//           </TableHead>
//         ))}
//       </TableRow>
//     </TableHeader>

//     <TableBody>
//       {sortedData.map((row, idx) => (
//         <TableRow
//           key={idx}
//           className={onRowClick ? "cursor-pointer hover:bg-blue-50" : ""}
//           onClick={() => onRowClick?.(row)}
//         >
//           {columns.map((column) => (
//             <TableCell key={String(column.key)} className={column.key === "gene" ? "font-medium" : ""}>
//               {column.render ? column.render(row[column.key], row) : row[column.key]}
//             </TableCell>
//           ))}
//         </TableRow>
//       ))}
//     </TableBody>
//   </Table>
// </div>

//     </div>
//   );
// };
// import React, { useState } from "react";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";

// interface DataTableProps<T> {
//   data: T[];
//   columns: {
//     key: keyof T | string;
//     header: string;
//     render?: (value: any, row: T) => React.ReactNode;
//     sortable?: boolean;
//   }[];
//   defaultSortKey?: keyof T | string;
//   defaultSortOrder?: "asc" | "desc";
//   onRowClick?: (row: T) => void;
//   className?: string;
//   scrollHeight?: string;
//   stickyHeader?: boolean;
//   showDownloadButtons?: boolean;
//   containerWidth?: string | number;
//   rowClassName?: (row: T, index: number) => string;
// }

// export const DataTable = <T extends Record<string, any>>({
//   data,
//   columns,
//   defaultSortKey,
//   defaultSortOrder = "asc",
//   onRowClick,
//   className = "",
//   scrollHeight = "400px",
//   stickyHeader = true,
//   showDownloadButtons = false,
//   containerWidth = "900px",
// }: DataTableProps<T>) => {
//   const [sortKey, setSortKey] = useState<keyof T | string | undefined>(defaultSortKey);
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

//   const handleSort = (key: keyof T | string) => {
//     if (sortKey === key) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortKey(key);
//       setSortOrder("asc");
//     }
//   };

//   const sortedData = [...data].sort((a, b) => {
//     if (!sortKey) return 0;
//     const aValue = a[sortKey];
//     const bValue = b[sortKey];
//     if (typeof aValue === "number" && typeof bValue === "number") {
//       return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
//     }
//     return sortOrder === "asc"
//       ? String(aValue).localeCompare(String(bValue))
//       : String(bValue).localeCompare(String(aValue));
//   });

//   const convertToCSV = (data: T[]) => {
//     const headers = columns.map((col) => col.header).join(",");
//     const rows = data.map((row) =>
//       columns
//         .map((col) => {
//           const value = row[col.key];
//           return `"${String(value).replace(/"/g, '""')}"`;
//         })
//         .join(",")
//     );
//     return [headers, ...rows].join("\n");
//   };

//   const downloadCSV = () => {
//     const csv = convertToCSV(sortedData);
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "table_data.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   const downloadJSON = () => {
//     const json = JSON.stringify(sortedData, null, 2);
//     const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "table_data.json");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="relative">
//       {showDownloadButtons && (
//         <div className="flex justify-end mb-2 gap-2">
//           <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={downloadCSV}>
//             Download CSV
//           </Button>
//           <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={downloadJSON}>
//             Download JSON
//           </Button>
//         </div>
//       )}
//       <div
//         className={`relative ${className}`}
//         style={{
//           maxHeight: scrollHeight,
//           width: containerWidth,
//           overflowY: "auto",
//           position: "relative", // Ensure stacking context
//         }}
//       >
//         <Table className="min-w-[500px] table-fixed">
//           <TableHeader>
//             <TableRow>
//               {columns.map((column) => (
//                 <TableHead
//                   key={String(column.key)}
//                   className={`text-blue-700 bg-white z-30 ${
//                     column.sortable ? "cursor-pointer" : ""
//                   } ${stickyHeader ? "sticky top-0" : ""}`}
//                   onClick={() => column.sortable && handleSort(column.key)}
//                 >
//                   {column.header}
//                   {column.sortable && sortKey === column.key && (
//                     <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
//                   )}
//                 </TableHead>
//               ))}
//             </TableRow>
//           </TableHeader>
//           {/* <TableHeader className="sticky top-0 z-30 bg-white shadow-sm">
//   <TableRow>
//     {columns.map((column) => (
//       <TableHead
//         key={String(column.key)}
//         className={`text-blue-700 bg-white ${
//           column.sortable ? "cursor-pointer" : ""
//         } ${stickyHeader ? "sticky top-0 z-30" : ""}`}
//         onClick={() => column.sortable && handleSort(column.key)}
//       >
//         {column.header}
//         {column.sortable && sortKey === column.key && (
//           <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
//         )}
//       </TableHead>
//     ))}
//   </TableRow>
// </TableHeader> */}

//           <TableBody>
//             {sortedData.map((row, idx) => (
//               <TableRow
//                 key={idx}
//                 className={onRowClick ? "cursor-pointer hover:bg-blue-50" : ""}
//                 onClick={() => onRowClick?.(row)}
//               >
//                 {columns.map((column) => (
//                   <TableCell
//                     key={String(column.key)}
//                     className={column.key === "gene" ? "font-medium" : ""}
//                   >
//                     {column.render ? column.render(row[column.key], row) : row[column.key]}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// };
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  defaultSortKey?: keyof T | string;
  defaultSortOrder?: "asc" | "desc";
  onRowClick?: (row: T) => void;
  className?: string;
  scrollHeight?: string;
  stickyHeader?: boolean;
  showDownloadButtons?: boolean;
  containerWidth?: string | number;
  rowClassName?: (row: T, index: number) => string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  defaultSortOrder = "asc",
  onRowClick,
  className = "",
  scrollHeight = "400px",
  stickyHeader = true,
  showDownloadButtons = false,
  containerWidth = "100%",
  rowClassName,
}: DataTableProps<T>) => {
  const [sortKey, setSortKey] = useState<keyof T | string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    return sortOrder === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const convertToCSV = (data: T[]) => {
    const headers = columns.map((col) => col.header).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = () => {
    const csv = convertToCSV(sortedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const json = JSON.stringify(sortedData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "table_data.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      {showDownloadButtons && (
        <div className="flex justify-end mb-2 gap-2">
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={downloadCSV}>
            Download CSV
          </Button>
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={downloadJSON}>
            Download JSON
          </Button>
        </div>
      )}
      <div
        className={`relative ${className}`}
        style={{
          maxHeight: scrollHeight,
          width: typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth,
          overflowY: 'auto',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`text-blue-700 bg-white z-30 ${column.sortable ? "cursor-pointer" : ""} ${stickyHeader ? "sticky top-0" : ""}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  {column.header}
                  {column.sortable && sortKey === column.key && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, idx) => (
              <TableRow
                key={idx}
                className={`${onRowClick ? "cursor-pointer hover:bg-blue-50" : ""} ${rowClassName ? rowClassName(row, idx) : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className={`truncate ${column.key === "gene" ? "font-medium" : ""}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};