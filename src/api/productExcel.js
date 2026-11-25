import { graphqlRequest } from "./graphql";

// REST endpoints live next to /graphql/ on the same Django server.
const API_ROOT = (import.meta.env.VITE_GRAPHQL_URI || "")
  .replace(/\/graphql\/?$/, "")
  .replace(/\/$/, "");

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `JWT ${token}` } : {};
};

const readError = async (response) => {
  try {
    const body = await response.json();
    return body.fileError || body.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const filenameFrom = (response, fallback) => {
  const header = response.headers.get("Content-Disposition") || "";
  const match = header.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : fallback;
};

const downloadExcel = async (path, fallbackName) => {
  const response = await fetch(`${API_ROOT}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readError(response));

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFrom(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const postFiles = async (path, fields) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, typeof value === "boolean" ? String(value) : value);
  });

  const response = await fetch(`${API_ROOT}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Upload failed (${response.status})`);
  }
  if (!response.ok && !body?.fileError) {
    throw new Error(`Upload failed (${response.status})`);
  }
  return body;
};

// ── Bulk product upload ─────────────────────────────────────────────
export const downloadBulkUploadTemplate = () =>
  downloadExcel("/api/products/bulk-upload/template/", "product-bulk-upload-template.xlsx");

export const uploadBulkProducts = ({ file, images, updateExisting, dryRun }) =>
  postFiles("/api/products/bulk-upload/", {
    file,
    images,
    update_existing: !!updateExisting,
    dry_run: !!dryRun,
  });

// ── Daily price sheet ───────────────────────────────────────────────
export const downloadDailyPriceSheet = () =>
  downloadExcel("/api/products/daily-prices/export/", "daily-prices.xlsx");

export const uploadDailyPrices = ({ file, dryRun }) =>
  postFiles("/api/products/daily-prices/import/", { file, dry_run: !!dryRun });

// ── Archive ─────────────────────────────────────────────────────────
const SET_PRODUCTS_ARCHIVED = `
  mutation SetProductsArchived($ids: [Int!]!, $archived: Boolean!) {
    setProductsArchived(ids: $ids, archived: $archived) { success count }
  }
`;

const SET_CATEGORIES_ARCHIVED = `
  mutation SetCategoriesArchived($ids: [Int!]!, $archived: Boolean!) {
    setCategoriesArchived(ids: $ids, archived: $archived) { success count }
  }
`;

export const setProductsArchived = async (ids, archived) => {
  const data = await graphqlRequest(SET_PRODUCTS_ARCHIVED, {
    ids: ids.map(Number),
    archived,
  });
  return data?.setProductsArchived;
};

export const setCategoriesArchived = async (ids, archived) => {
  const data = await graphqlRequest(SET_CATEGORIES_ARCHIVED, {
    ids: ids.map(Number),
    archived,
  });
  return data?.setCategoriesArchived;
};
