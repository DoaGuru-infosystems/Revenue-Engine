import React from "react";
import { Megaphone } from "lucide-react";

const OrderItemCard = ({ order, onEdit, onDelete }) => {
  return (
    <div className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Megaphone className="w-5 h-5 text-yellow-400" />
            <span>
              {order.service_name} → {order.category_name}
            </span>
          </div>
          <div className="text-lg text-white/80">
            🎬 {order.editing_type_name} × {order.quantity}
          </div>
          {(Number(order.include_content_posting) > 0 ||
            Number(order.include_thumbnail_creation) > 0) && (
            <div className="text-base text-white/60 italic">
              {Number(order.include_content_posting) > 0 && (
                <>📢 Meta Growth & Content Management </>
              )}
              {Number(order.include_thumbnail_creation) > 0 && (
                <>🖼 Thumbnail Creation</>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-green-400 font-bold text-xl">
            ₹{parseFloat(order.total_amount).toLocaleString()}
          </div>
          <button
            onClick={() => onEdit(order)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemCard;
