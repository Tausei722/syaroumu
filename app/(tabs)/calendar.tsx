import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, Switch,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { getEvents, createEvent, deleteEvent } from "../../services/api";
import { useAuthStore } from "../../store/auth";

LocaleConfig.locales["ja"] = {
  monthNames: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  monthNamesShort: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  dayNames: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
  dayNamesShort: ["日","月","火","水","木","金","土"],
};
LocaleConfig.defaultLocale = "ja";

interface Event {
  id: string;
  title: string;
  event_type: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
}

const TYPE_COLOR: Record<string, string> = {
  employee: "#3498db",
  client: "#e67e22",
  internal: "#27ae60",
};

const TYPE_LABEL: Record<string, string> = {
  employee: "社員",
  client: "クライアント",
  internal: "社内",
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("employee");
  const [allDay, setAllDay] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => { if (user?.company_id) fetchEvents(); }, [user?.company_id]);

  const fetchEvents = async () => {
    if (!user?.company_id) return;
    try {
      const { data } = await getEvents(user.company_id);
      setEvents(data);
    } catch {
      Alert.alert("エラー", "予定の取得に失敗しました");
    }
  };

  const markedDates = events.reduce((acc, e) => {
    const date = dayjs(e.start_at).format("YYYY-MM-DD");
    acc[date] = {
      marked: true,
      dotColor: TYPE_COLOR[e.event_type] ?? "#999",
      selected: date === selectedDate,
      selectedColor: "#1e3a5f",
    };
    return acc;
  }, {} as Record<string, object>);

  if (!markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: "#1e3a5f" };
  }

  const dayEvents = events.filter(
    (e) => dayjs(e.start_at).format("YYYY-MM-DD") === selectedDate
  );

  const handleCreate = async () => {
    if (!title) { Alert.alert("入力エラー", "タイトルを入力してください"); return; }
    try {
      await createEvent({
        title,
        event_type: eventType,
        start_at: `${selectedDate}T09:00:00`,
        end_at: `${selectedDate}T18:00:00`,
        all_day: allDay,
        company_id: user!.company_id,
      });
      setTitle("");
      setModalVisible(false);
      await fetchEvents();
    } catch {
      Alert.alert("エラー", "予定の作成に失敗しました");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("削除", "この予定を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: async () => {
        await deleteEvent(id);
        await fetchEvents();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(d) => setSelectedDate(d.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: "#e74c3c",
          selectedDayBackgroundColor: "#1e3a5f",
          arrowColor: "#1e3a5f",
        }}
      />

      <View style={styles.legend}>
        {Object.entries(TYPE_LABEL).map(([type, label]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: TYPE_COLOR[type] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>{dayjs(selectedDate).format("M月D日 (ddd)")}の予定</Text>
        <FlatList
          data={dayEvents}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <View style={[styles.eventCard, { borderLeftColor: TYPE_COLOR[item.event_type] }]}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventType}>{TYPE_LABEL[item.event_type]}</Text>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {!item.all_day && (
                  <Text style={styles.eventTime}>
                    {dayjs(item.start_at).format("HH:mm")} - {dayjs(item.end_at).format("HH:mm")}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>予定はありません</Text>}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dayjs(selectedDate).format("M/D")} の予定を追加</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="予定のタイトル"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>種別</Text>
          <View style={styles.typeRow}>
            {Object.entries(TYPE_LABEL).map(([type, label]) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, eventType === type && { backgroundColor: TYPE_COLOR[type] }]}
                onPress={() => setEventType(type)}
              >
                <Text style={[styles.typeBtnText, eventType === type && { color: "#fff" }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>終日</Text>
            <Switch value={allDay} onValueChange={setAllDay} />
          </View>

          <TouchableOpacity style={styles.postButton} onPress={handleCreate}>
            <Text style={styles.postButtonText}>予定を追加</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  legend: { flexDirection: "row", gap: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#666" },
  daySection: { flex: 1, padding: 16 },
  dayTitle: { fontSize: 15, fontWeight: "bold", color: "#1e3a5f", marginBottom: 12 },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventInfo: { flex: 1 },
  eventType: { fontSize: 11, color: "#999", marginBottom: 2 },
  eventTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  eventTime: { fontSize: 12, color: "#666", marginTop: 2 },
  empty: { textAlign: "center", color: "#999", marginTop: 24 },
  fab: {
    position: "absolute", bottom: 24, right: 24,
    backgroundColor: "#1e3a5f", width: 56, height: 56,
    borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6,
  },
  modal: { flex: 1, padding: 24, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 17, fontWeight: "bold", color: "#1e3a5f" },
  input: { borderWidth: 1, borderColor: "#dde3ec", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15 },
  label: { fontSize: 14, color: "#555", marginBottom: 8 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: { borderWidth: 1, borderColor: "#dde3ec", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  typeBtnText: { fontSize: 14, color: "#555" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  postButton: { backgroundColor: "#1e3a5f", borderRadius: 8, padding: 16, alignItems: "center" },
  postButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
