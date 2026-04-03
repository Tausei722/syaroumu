import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  getRemainingPaidLeave, getLeaveRequests,
  createLeaveRequest, approveLeaveRequest, rejectLeaveRequest,
} from "../../services/api";
import { useAuthStore } from "../../store/auth";

const LEAVE_TYPES = [
  { value: "paid", label: "有給休暇" },
  { value: "half_day", label: "半休" },
  { value: "sick", label: "病気休暇" },
  { value: "early_leave", label: "早退" },
  { value: "late", label: "遅刻" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "申請中", color: "#e67e22" },
  approved: { label: "承認済", color: "#27ae60" },
  rejected: { label: "却下",   color: "#e74c3c" },
};

export default function LeaveScreen() {
  const [remaining, setRemaining] = useState<number>(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState("paid");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.role === "sharoushi" || user?.role === "company_admin";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [rem, reqs] = await Promise.all([
        getRemainingPaidLeave(),
        user?.company_id ? getLeaveRequests(user.company_id) : Promise.resolve({ data: [] }),
      ]);
      setRemaining(rem.data);
      setRequests(reqs.data);
    } catch {
      Alert.alert("エラー", "データの取得に失敗しました");
    }
  };

  const handleSubmit = async () => {
    try {
      await createLeaveRequest({
        leave_type: leaveType,
        start_date: `${startDate}T00:00:00`,
        end_date: `${startDate}T23:59:59`,
      });
      setModalVisible(false);
      await fetchData();
      Alert.alert("申請完了", "休暇申請を送信しました");
    } catch {
      Alert.alert("エラー", "申請に失敗しました");
    }
  };

  const handleApprove = async (id: string) => {
    await approveLeaveRequest(id);
    await fetchData();
  };

  const handleReject = async (id: string) => {
    await rejectLeaveRequest(id);
    await fetchData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>有給残日数</Text>
        <Text style={styles.summaryDays}>{remaining}<Text style={styles.summaryUnit}> 日</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>申請一覧</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status];
          const typeLabel = LEAVE_TYPES.find((t) => t.value === item.leave_type)?.label ?? item.leave_type;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardType}>{typeLabel}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.cardDate}>{dayjs(item.start_date).format("YYYY/MM/DD")}</Text>
              {isAdmin && item.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                    <Text style={styles.approveBtnText}>承認</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                    <Text style={styles.rejectBtnText}>却下</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>申請はありません</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>休暇申請</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>申請種別</Text>
          {LEAVE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeOption, leaveType === t.value && styles.typeOptionSelected]}
              onPress={() => setLeaveType(t.value)}
            >
              <Ionicons
                name={leaveType === t.value ? "radio-button-on" : "radio-button-off"}
                size={20}
                color="#1e3a5f"
              />
              <Text style={styles.typeOptionText}>{t.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: 16 }]}>日付: {startDate}</Text>

          <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
            <Text style={styles.postButtonText}>申請する</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  summaryCard: {
    backgroundColor: "#1e3a5f", margin: 16, borderRadius: 16,
    padding: 24, alignItems: "center",
  },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  summaryDays: { color: "#fff", fontSize: 48, fontWeight: "bold", marginTop: 4 },
  summaryUnit: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#555", paddingHorizontal: 16, marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardType: { fontSize: 15, fontWeight: "600", color: "#333" },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cardDate: { fontSize: 13, color: "#888" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  approveBtn: {
    flex: 1, backgroundColor: "#27ae60", borderRadius: 6,
    padding: 10, alignItems: "center",
  },
  approveBtnText: { color: "#fff", fontWeight: "bold" },
  rejectBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 6,
    padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#e74c3c",
  },
  rejectBtnText: { color: "#e74c3c", fontWeight: "bold" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  fab: {
    position: "absolute", bottom: 24, right: 24,
    backgroundColor: "#1e3a5f", width: 56, height: 56,
    borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6,
  },
  modal: { flex: 1, padding: 24, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f" },
  label: { fontSize: 14, color: "#555", marginBottom: 8, fontWeight: "600" },
  typeOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#dde3ec", marginBottom: 8,
  },
  typeOptionSelected: { borderColor: "#1e3a5f", backgroundColor: "#eef2f8" },
  typeOptionText: { fontSize: 15, color: "#333" },
  postButton: { backgroundColor: "#1e3a5f", borderRadius: 8, padding: 16, alignItems: "center", marginTop: 24 },
  postButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
