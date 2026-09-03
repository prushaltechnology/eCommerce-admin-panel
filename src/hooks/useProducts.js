import { message } from "antd";
import { useCallback, useState } from "react";
import {
  addProductImage as addProductImageApi,
  createProduct as createProductApi,
  deleteProduct as deleteProductApi,
  deleteProductImage as deleteProductImageApi,
  getAllProducts as getAllProductsApi,
  getProductById as getProductByIdApi,
  getProductCategories as getProductCategoriesApi,
  updateProduct as updateProductApi,
  updateStock as updateStockApi,
} from "../api/products";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = useCallback(
    async (
      first = 50,
      after = null,
      search = null,
      categoryId = null,
      isActive = null,
      append = false,
    ) => {
      setLoadingProducts(true);
      try {
        const response = await getAllProductsApi(
          first,
          after,
          search,
          categoryId,
          isActive,
        );
        if (response.success) {
          setProducts((prevProducts) => {
            const nextProducts = response.products || [];
            return append ? [...prevProducts, ...nextProducts] : nextProducts;
          });
          return {
            products: response.products || [],
            nextCursor: response.nextCursor || null,
            hasMore: response.hasMore || false,
          };
        }
        message.error(response.message || "Failed to load products");
        setProducts([]);
        return { products: [], nextCursor: null, hasMore: false };
      } catch (error) {
        message.error(error.message || "Failed to load products");
        setProducts([]);
        return { products: [], nextCursor: null, hasMore: false };
      } finally {
        setLoadingProducts(false);
      }
    },
    [],
  );

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await getProductCategoriesApi();
      if (response.success) {
        setCategories(response.categories || []);
        return response.categories || [];
      }
      message.error(response.message || "Failed to load categories");
      setCategories([]);
      return [];
    } catch (error) {
      message.error(error.message || "Failed to load categories");
      setCategories([]);
      return [];
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const getProductById = useCallback(async (id) => {
    setActionLoading(true);
    try {
      const response = await getProductByIdApi(id);
      if (response.success) return response.product;
      message.error(response.message || "Failed to load product");
      return null;
    } catch (error) {
      message.error(error.message || "Failed to load product");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData) => {
    setActionLoading(true);
    try {
      const response = await createProductApi(productData);
      if (response.success) {
        message.success("Product created successfully");
        return response.product;
      }
      message.error(response.message || "Failed to create product");
      return null;
    } catch (error) {
      message.error(error.message || "Failed to create product");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    setActionLoading(true);
    try {
      const response = await updateProductApi(id, productData);
      if (response.success) {
        message.success("Product updated successfully");
        return response.product;
      }
      message.error(response.message || "Failed to update product");
      return null;
    } catch (error) {
      message.error(error.message || "Failed to update product");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    setActionLoading(true);
    try {
      const response = await deleteProductApi(id);
      if (response.success) {
        setProducts((prev) => prev.filter((item) => item.id !== id));
        message.success("Product deleted successfully");
        return true;
      }
      message.error(response.message || "Failed to delete product");
      return false;
    } catch (error) {
      message.error(error.message || "Failed to delete product");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const addProductImage = useCallback(
    async (productId, imageFile, sortOrder = 1) => {
      setActionLoading(true);
      try {
        const response = await addProductImageApi(
          productId,
          imageFile,
          sortOrder,
        );
        if (response.success) {
          return response.product;
        }
        message.error(response.message || "Failed to upload image");
        return null;
      } catch (error) {
        message.error(error.message || "Failed to upload image");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [],
  );

  const deleteProductImage = useCallback(async (imageId) => {
    setActionLoading(true);
    try {
      const response = await deleteProductImageApi(imageId);
      if (response.success) {
        //message.success('Image deleted successfully');
        return true;
      }
      message.error(response.message || "Failed to delete image");
      return false;
    } catch (error) {
      message.error(error.message || "Failed to delete image");
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateProductStock = useCallback(
    async (productId, inventoryType, quantity) => {
      setActionLoading(true);
      try {
        const response = await updateStockApi(
          productId,
          inventoryType,
          quantity,
        );
        if (response.success) {
          message.success("Stock updated successfully");
          return response.stock;
        }
        message.error(response.message || "Failed to update stock");
        return null;
      } catch (error) {
        message.error(error.message || "Failed to update stock");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [],
  );

  return {
    products,
    categories,
    loadingProducts,
    loadingCategories,
    actionLoading,
    fetchProducts,
    fetchCategories,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductImage,
    deleteProductImage,
    updateProductStock,
  };
}
