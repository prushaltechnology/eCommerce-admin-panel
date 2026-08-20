import { Typography } from "antd";
import { useState } from "react";
import useTransactions from "../hooks/useTransactions";
import TransactionDetailModal from "./Transactions/TransactionDetailModal";
import TransactionFilters from "./Transactions/TransactionFilters";
import TransactionStatsBar from "./Transactions/TransactionStatsBar";
import TransactionTable from "./Transactions/TransactionTable";

const { Title } = Typography;

export default function Transactions() {
    const {
        transactions,
        total,
        loading,
        loadingMore,
        hasMore,
        setSearch,
        loadMore,
    } = useTransactions();

    const [selected, setSelected] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleViewDetail = (record) => {
        setSelected(record);
        setModalOpen(true);
    };

    return (
        <div style={{ padding: 24, background: "#f5f6fa", minHeight: "100vh" }}>

            {/* Page header */}
            <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                    Payment Transactions Management
                </Title>
            </div>

            {/* Stats */}
            <TransactionStatsBar transactions={transactions} total={total} loading={loading} />

            {/* Search */}
            <TransactionFilters onSearch={setSearch} />

            {/* Table with infinite scroll */}
            <TransactionTable
                transactions={transactions}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onViewDetail={handleViewDetail}
            />

            {/* Detail modal */}
            <TransactionDetailModal
                open={modalOpen}
                transaction={selected}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}