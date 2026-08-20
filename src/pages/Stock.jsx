import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductModal from '../components/modals/ProductModal';
import usePermissions from '../hooks/usePermissions';
import useProducts from '../hooks/useProducts';
import StockHeader from './stocks/StockHeader';
import StockStats from './stocks/StockStats';
import StockTable from './stocks/StockTable';
import StockUpdateModal from './stocks/StockUpdateModal';
import useStockManager from '../hooks/useStockManager';
import { getProductStock } from '../api/products';

const VALID_FILTERS = ['low', 'critical', 'out'];

const Stock = () => {
  const { canUpdate } = usePermissions();
  const canManageStock = canUpdate('stock');
  const canCreateProduct = canUpdate('product');

  // Both directions now go through this: URL -> filter (notification links,
  // reload, back/forward) AND filter -> URL (dropdown selection), so the
  // two can never drift apart the way they could when only navigate()
  // from the sidebar wrote to the URL.
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    categories,
    actionLoading,
    fetchCategories,
    createProduct,
    addProductImage,
    updateProductStock,
  } = useProducts();

  const {
    filteredStocks,
    stocksLoading,
    fetchingMore,
    hasMore,
    nextCursor,
    stockStats,
    searchText,
    setSearchText,
    stockFilter,
    setStockFilter,
    loadStocks,

    productList,
    productListLoading,
    handleProductSearch,
    handleProductPopupScroll,

    getStockQuantity,
    getStockStatus,
    getStockPercentage,
    getStorefrontAvailable,
    getSystemAvailable,
  } = useStockManager();

  // URL -> filter state (covers: notification click, manual URL edit,
  // browser back/forward, and page reload while ?filter= is present)
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && VALID_FILTERS.includes(filterParam)) {
      setStockFilter(filterParam);
    } else {
      setStockFilter('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // filter state -> URL (covers: dropdown selection). "all" clears the
  // param instead of writing ?filter=all, so the two representations of
  // "no filter" (missing param vs literal "all") don't fall out of sync.
  const handleStockFilterChange = useCallback(
    (value) => {
      setStockFilter(value);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && VALID_FILTERS.includes(value)) {
            next.set('filter', value);
          } else {
            next.delete('filter');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setStockFilter, setSearchParams]
  );

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockForm] = Form.useForm();

  const handleOpenManageStock = () => {
    if (!canManageStock) return;
    stockForm.resetFields();
    setSelectedStockItem(null);
    setIsStockModalOpen(true);
  };

  const handleEditStock = (record, type, inventoryType = 'storefront') => {
    if (!canManageStock) return;

    setSelectedStockItem(record);
    stockForm.setFieldsValue({
      inventoryType,
      stock:
        type === 'set'
          ? (inventoryType === 'storefront' ? record.storefrontStock : record.systemStock)
          : undefined,
      updateType: type,
      quantity: 1,
    });
    setIsStockModalOpen(true);
  };

  // Single source of truth for product selection in the "Manage Stock" flow.
  // Prefers the authoritative stock-table data (filteredStocks) over
  // productList, since productList's stock fields are not reliably kept
  // in sync. Falls back to a direct getProductStock() fetch if the product
  // hasn't been loaded into filteredStocks yet (e.g. it's on a later page).
  const handleProductSelect = async (value) => {
    const product = productList.find((p) => p.id === value);
    if (!product) return;

    const existing = filteredStocks.find((s) => s.id === product.id);

    let storefrontStock = existing?.storefrontStock;
    let systemStock = existing?.systemStock;

    if (storefrontStock === undefined || systemStock === undefined) {
      const [storefrontRes, systemRes] = await Promise.all([
        getProductStock(product.id, 'storefront'),
        getProductStock(product.id, 'system'),
      ]);

      storefrontStock = storefrontRes.success ? Number(storefrontRes.stock?.quantity || 0) : 0;
      systemStock = systemRes.success ? Number(systemRes.stock?.quantity || 0) : 0;

      if (!storefrontRes.success && !systemRes.success) {
        message.error('Could not load current stock for this product');
      }
    }

    setSelectedStockItem({
      id: product.id,
      name: product.name,
      storefrontStock: Number(storefrontStock || 0),
      systemStock: Number(systemStock || 0),
    });
    stockForm.setFieldsValue({ updateType: 'add', quantity: 1 });
  };

  const handleStockFormFinish = async (values) => {
    if (!canManageStock) return;

    if (!selectedStockItem) {
      message.error('Please select a product first');
      return;
    }

    try {
      const currentQty =
        values.inventoryType === 'storefront'
          ? selectedStockItem.storefrontStock || 0
          : selectedStockItem.systemStock || 0;
      let newStock = currentQty;

      if (values.updateType === 'set') newStock = values.stock;
      if (values.updateType === 'add') newStock = currentQty + values.quantity;
      if (values.updateType === 'subtract') newStock = Math.max(0, currentQty - values.quantity);

      const res = await updateProductStock(selectedStockItem.id, values.inventoryType, newStock);

      if (res) {
        await loadStocks(searchText, null, true);
        setIsStockModalOpen(false);
        setSelectedStockItem(null); // reset so next open starts clean
        stockForm.resetFields();
      }
    } catch (err) {
      message.error(err?.message || 'Failed to update stock');
    }
  };

  const handleLoadMore = useCallback(() => {
    loadStocks(searchText, nextCursor, false);
  }, [loadStocks, searchText, nextCursor]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    if (canCreateProduct) {
      fetchCategories();
    }
  }, [canCreateProduct, fetchCategories]);

  const handleAddProduct = () => {
    if (!canCreateProduct) return;
    productForm.resetFields();
    setImageList([]);
    setIsProductModalOpen(true);
  };

  const handleProductModalClose = () => {
    setIsProductModalOpen(false);
    productForm.resetFields();
    setImageList([]);
  };

  const handleProductSubmit = async (values) => {
    if (!canCreateProduct) return;

    setProductLoading(true);
    try {
      const newProduct = await createProduct({
        ...values,
        categoryId: Number(values.categoryId),
        price: Number(values.price),
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        measureValue: values.measureValue ? Number(values.measureValue) : undefined,
        weight: values.weight ? Number(values.weight) : undefined,
      });

      if (newProduct?.id) {
        for (const img of imageList.filter((i) => !i.id && i.originFileObj)) {
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(img.originFileObj);
            reader.onload = async () => {
              await addProductImage(newProduct.id, reader.result, 0);
              resolve();
            };
          });
        }
        message.success('Product added successfully!');
        handleProductModalClose();
      } else {
        message.error('Failed to add product');
      }
    } catch {
      message.error('An error occurred while adding product');
    } finally {
      setProductLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <StockHeader
        onManageStock={handleOpenManageStock}
        onAddProduct={handleAddProduct}
        canManageStock={canManageStock}
        canCreateProduct={canCreateProduct}
      />

      <StockStats stats={stockStats} loading={stocksLoading} />

      <StockTable
        items={filteredStocks}
        loading={stocksLoading}
        fetchingMore={fetchingMore}
        hasMore={hasMore}
        searchText={searchText}
        stockFilter={stockFilter}
        onSearchChange={setSearchText}
        onFilterChange={handleStockFilterChange}
        onEditStock={handleEditStock}
        canManageStock={canManageStock}
        onLoadMore={handleLoadMore}
        getStockQuantity={getStockQuantity}
        getStockStatus={getStockStatus}
        getStockPercentage={getStockPercentage}
        getStorefrontAvailable={getStorefrontAvailable}
        getSystemAvailable={getSystemAvailable}
      />

      {canManageStock && (
        <StockUpdateModal
          open={isStockModalOpen}
          onCancel={() => {
            setIsStockModalOpen(false);
            setSelectedStockItem(null);
          }}
          onFinish={handleStockFormFinish}
          form={stockForm}
          actionLoading={actionLoading}
          selectedItem={selectedStockItem}
          onProductSelect={handleProductSelect}
          productList={productList}
          productListLoading={productListLoading}
          onProductSearch={handleProductSearch}
          onProductPopupScroll={handleProductPopupScroll}
        />
      )}

      {canCreateProduct && (
        <ProductModal
          visible={isProductModalOpen}
          onCancel={handleProductModalClose}
          onSubmit={handleProductSubmit}
          form={productForm}
          categories={categories}
          loading={productLoading}
          imageList={imageList}
          setImageList={setImageList}
          title="Add Product"
        />
      )}
    </div>
  );
};

export default Stock;