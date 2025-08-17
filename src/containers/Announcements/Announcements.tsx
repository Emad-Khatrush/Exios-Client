import React, { useEffect, useState } from "react";
import { 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle 
} from "react-icons/fa";
import api from "../../api";
import moment from "moment-timezone";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  publishedAt: Date
};

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements();
  }, []);

  const getAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get("posts");
      setAnnouncements(res.data.results || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const icons: Record<string, JSX.Element> = {
    info: <FaInfoCircle className="text-blue-500 text-xl" />,
    success: <FaCheckCircle className="text-green-500 text-xl" />,
    warning: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
    error: <FaTimesCircle className="text-red-500 text-xl" />,
  };

  return (
    <div className="space-y-4">
      {/* حالة التحميل */}
      {loading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">جاري تحميل الإعلانات...</p>
        </div>
      )}

      {/* لا يوجد إعلانات */}
      {!loading && announcements.length === 0 && (
        <div className="m-5 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
          🚀 لا يوجد إعلانات جديدة حالياً
        </div>
      )}

      {/* عرض الإعلانات */}
      {!loading &&
        announcements.map((a) => (
          <div
            key={a._id}
            className={`flex items-start p-4 rounded-xl shadow-md transition hover:shadow-lg bg-white border-r-4 m-2
              ${a.type === "info" ? "border-blue-400" : ""}
              ${a.type === "success" ? "border-green-400" : ""}
              ${a.type === "warning" ? "border-yellow-400" : ""}
              ${a.type === "error" ? "border-red-400" : ""}
            `}
          >
            <div className="mr-3">{icons[a.type]}</div>
            <span className="text-gray-600">{moment(a.publishedAt).format('DD/MM/YYYY')}</span>
            <div className="text-right flex-1">
              <h3 className="font-bold text-gray-800">{a.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {a.message}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Announcements;
