import { useQuery } from "@tanstack/react-query";

function checkFeedbackAdmin() {
  return fetch("/api/admin/feedback?page=1&limit=1", { credentials: "include" }).then((res) => {
    if (res.status === 403) return { isAdmin: false };
    if (!res.ok) throw new Error("Failed to check feedback admin status");
    return { isAdmin: true };
  });
}

function checkBlogAdmin() {
  return fetch("/api/admin/blog", { credentials: "include" }).then((res) => {
    if (res.status === 403) return { isAdmin: false };
    if (!res.ok) throw new Error("Failed to check blog admin status");
    return res.json();
  });
}

export function useAdminFlags() {
  const feedback = useQuery({
    queryKey: ["feedback-admin-check"],
    queryFn: checkFeedbackAdmin,
    retry: false,
  });

  const blog = useQuery({
    queryKey: ["blog-admin-check"],
    queryFn: checkBlogAdmin,
    retry: false,
  });

  return {
    isFeedbackAdmin: feedback.data?.isAdmin ?? false,
    isBlogAdmin: blog.data?.isAdmin ?? false,
    loading: feedback.isLoading || blog.isLoading,
  };
}
