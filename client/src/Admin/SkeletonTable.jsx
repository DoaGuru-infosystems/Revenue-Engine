export default function SkeletonTable() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="p-4">
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                SNo.
              </th>
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                Date
              </th>
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                Client
              </th>
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                TXN ID
              </th>
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                User/Team
              </th>
              <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className="border-b">
                {[...Array(6)].map((__, j) => (
                  <td key={j} className="py-4 px-4">
                    <div className="h-3 w-full max-w-[160px] bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
