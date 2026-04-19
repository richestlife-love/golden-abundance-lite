// React app page — 金富有志工
// Full-viewport mobile-app landing. No device frame. Responsive, CTA always visible.

import { useState } from 'react';
import { TASKS, MOCK_TEAMS } from './data';
import { getEffectiveStatus } from './utils';
import GlobalStyles from './ui/GlobalStyles';
import BottomNav from './ui/BottomNav';
import FormShell from './ui/FormShell';
import FieldLabel from './ui/FieldLabel';
import TextInput from './ui/TextInput';
import Textarea from './ui/Textarea';
import ChipGroup from './ui/ChipGroup';
import SubmitButton from './ui/SubmitButton';
import FormSuccessOverlay from './ui/FormSuccessOverlay';
import LandingScreen from './screens/LandingScreen';
import GoogleAuthScreen from './screens/GoogleAuthScreen';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import RankScreen from './screens/RankScreen';
import RewardsScreen from './screens/RewardsScreen';
import MyScreen from './screens/MyScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProfileSetupForm from './screens/ProfileSetupForm';


// Task 1 — Interest & skills form
function InterestForm({ onCancel, onSubmit }) {
  const bg = "#FFFDF5";
  const muted = "rgba(50,40,0,0.6)";
  const cardBg = "rgba(255,255,255,0.6)";
  const cardBorder = "1px solid rgba(255,255,255,0.9)";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [availability, setAvailability] = useState([]);

  const valid =
    name.trim() &&
    phone.trim() &&
    interests.length > 0 &&
    availability.length > 0;
  const card = {
    padding: "14px 14px",
    borderRadius: 16,
    background: cardBg,
    border: cardBorder,
    backdropFilter: "blur(10px)",
  };

  return (
    <FormShell
      bg={bg}
      title="填寫志工表單"
      subtitle="填寫個人資訊、興趣與可投入時段"
      onCancel={onCancel}
      footer={
        <SubmitButton
          label="提交表單"
          onClick={onSubmit}
          disabled={!valid}
          color="#fec701"
        />
      }
    >
      <div style={card}>
        <FieldLabel required>
          姓名
        </FieldLabel>
        <TextInput
          value={name}
          onChange={setName}
          placeholder="請輸入你的姓名"
        />
      </div>

      <div style={card}>
        <FieldLabel required>
          聯絡電話
        </FieldLabel>
        <TextInput
          value={phone}
          onChange={setPhone}
          placeholder="09xx-xxxxxx"
        />
      </div>

      <div style={card}>
        <FieldLabel required>
          興趣方向
        </FieldLabel>
        <div
          style={{
            fontSize: 11,
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          可複選
        </div>
        <ChipGroup
          options={[
            "活動策劃",
            "接待導覽",
            "文宣設計",
            "攝影紀錄",
            "物資管理",
            "陪伴關懷",
            "翻譯協助",
            "其他",
          ]}
          value={interests}
          onChange={setInterests}
          multi
        />
      </div>

      <div style={card}>
        <FieldLabel>專長技能</FieldLabel>
        <div
          style={{
            fontSize: 11,
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          可複選，協助我們配對合適的任務
        </div>
        <ChipGroup
          options={[
            "領導統籌",
            "設計美編",
            "活動企劃",
            "影像剪輯",
            "外語",
            "文案寫作",
            "資料分析",
            "樂器演奏",
          ]}
          value={skills}
          onChange={setSkills}
          multi
        />
      </div>

      <div style={card}>
        <FieldLabel required>
          可投入時段
        </FieldLabel>
        <ChipGroup
          options={["平日白天", "平日晚上", "週末白天", "週末晚上"]}
          value={availability}
          onChange={setAvailability}
          multi
        />
      </div>
    </FormShell>
  );
}

// Task 2 — Ticket form
function TicketForm({ onCancel, onSubmit }) {
  const bg = "#FFFDF5";
  const cardBg = "rgba(255,255,255,0.6)";
  const cardBorder = "1px solid rgba(255,255,255,0.9)";
  const muted = "rgba(50,40,0,0.6)";

  const [name, setName] = useState("");
  const [ticket725, setTicket725] = useState("");
  const [ticket726, setTicket726] = useState("");
  const [note, setNote] = useState("");

  const valid = name.trim() && ticket725.trim() && ticket726.trim();
  const card = {
    padding: "14px 14px",
    borderRadius: 16,
    background: cardBg,
    border: cardBorder,
    backdropFilter: "blur(10px)",
  };

  return (
    <FormShell
      bg={bg}
      title="夏季盛會報名"
      subtitle="請輸入 7/25 與 7/26 場次票券編號"
      onCancel={onCancel}
      footer={
        <SubmitButton
          label="提交報名"
          onClick={onSubmit}
          disabled={!valid}
          color="#8AD4B0"
        />
      }
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 16,
          background:
            "linear-gradient(135deg, rgba(138,212,176,0.18), rgba(138,212,176,0.08))",
          border: `1px solid ${"rgba(138,212,176,0.4)"}`,
          fontSize: 12,
          color: "#2E7B5A",
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>📅 夏季盛會資訊</div>
        7 月 25 日（六）·活動一日場
        <br />7 月 26 日（日）·活動二日場
      </div>

      <div style={card}>
        <FieldLabel required>
          姓名
        </FieldLabel>
        <TextInput
          value={name}
          onChange={setName}
          placeholder="請輸入你的姓名"
        />
      </div>

      <div style={card}>
        <FieldLabel required>
          7/25 票券編號
        </FieldLabel>
        <TextInput
          value={ticket725}
          onChange={setTicket725}
          placeholder="例如：RL-0725-8420"
        />
        <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>
          可於購票 Email 或錢包中找到 12 位編號
        </div>
      </div>

      <div style={card}>
        <FieldLabel required>
          7/26 票券編號
        </FieldLabel>
        <TextInput
          value={ticket726}
          onChange={setTicket726}
          placeholder="例如：RL-0726-1173"
        />
      </div>

      <div style={card}>
        <FieldLabel>備註</FieldLabel>
        <Textarea
          value={note}
          onChange={setNote}
          placeholder="飲食需求、交通協助等（可留白）"
        />
      </div>
    </FormShell>
  );
}

// Task 3 — Join a team (search by team ID, name, or leader)
function TeamForm({ onCancel, onSubmit }) {
  const bg = "#FFFDF5";
  const fg = "#241c00";
  const muted = "rgba(50,40,0,0.6)";
  const cardBg = "rgba(255,255,255,0.6)";
  const cardBorder = "1px solid rgba(255,255,255,0.9)";

  const [teamQuery, setTeamQuery] = useState("");
  const [pendingJoin, setPendingJoin] = useState(null);

  const card = {
    padding: "14px 14px",
    borderRadius: 16,
    background: cardBg,
    border: cardBorder,
    backdropFilter: "blur(10px)",
  };

  const q = teamQuery.trim().toUpperCase();
  const filteredTeams = MOCK_TEAMS.filter(
    (t) =>
      q === "" ||
      t.id.toUpperCase().includes(q) ||
      t.name.includes(teamQuery) ||
      t.leader.includes(teamQuery) ||
      t.topic.includes(teamQuery),
  );

  const valid = pendingJoin != null;

  const handleSubmit = () => {
    const t = MOCK_TEAMS.find((x) => x.id === pendingJoin);
    if (!t) return;
    // Populate with a few mock members so the team view feels real
    const mockMemberPool = [
      {
        id: "m-a",
        name: "林詠瑜",
        avatar: "linear-gradient(135deg, #fed234, #fec701)",
      },
      {
        id: "m-b",
        name: "陳志豪",
        avatar: "linear-gradient(135deg, #fec701, #B8A4E3)",
      },
      {
        id: "m-c",
        name: "王美玲",
        avatar: "linear-gradient(135deg, #8AD4B0, #fec701)",
      },
      {
        id: "m-d",
        name: "張書維",
        avatar: "linear-gradient(135deg, #FFC170, #F39770)",
      },
    ];

    const mockMembers = mockMemberPool.slice(
      0,
      Math.max(0, (t.members || 1) - 1),
    );
    onSubmit({
      id: t.id,
      status: "pending",
      name: t.name,
      topic: t.topic,
      leader: { id: t.leaderId, name: t.leader, avatar: t.leaderAvatar },
      members: mockMembers,
      currentCount: t.members,
      cap: t.cap,
      points: t.points,
      weekPoints: t.weekPoints,
      rank: t.rank,
    });
  };

  return (
    <FormShell
      bg={bg}
      title="加入團隊"
      subtitle="輸入團隊編號或搜尋名稱，向組長送出申請"
      onCancel={onCancel}
      footer={
        <SubmitButton
          label={valid ? "送出加入申請" : "請先選擇團隊"}
          onClick={handleSubmit}
          disabled={!valid}
          color="#6dae4a"
        />
      }
    >
      <div style={card}>
        <FieldLabel required>
          團隊編號 / 名稱
        </FieldLabel>
        <div
          style={{
            fontSize: 11,
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          例如：T-MING2024、星河守望隊、周明蓁
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: muted,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder="輸入團隊編號或關鍵字"
            style={{
              width: "100%",
              height: 44,
              padding: "0 14px 0 38px",
              borderRadius: 12,
              border: "1px solid rgba(109,174,74,0.4)",
              background: "rgba(255,255,255,0.9)",
              fontSize: 13,
              color: fg,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: 0.3,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredTeams.length === 0 ? (
            <div
              style={{
                padding: "24px 12px",
                textAlign: "center",
                color: muted,
                fontSize: 12,
                border: "1px dashed rgba(109,174,74,0.35)",
                borderRadius: 12,
                lineHeight: 1.6,
              }}
            >
              找不到符合的團隊
              <br />
              <span style={{ fontSize: 11 }}>請確認團隊編號是否正確</span>
            </div>
          ) : (
            filteredTeams.map((team) => {
              const isPending = pendingJoin === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => setPendingJoin(isPending ? null : team.id)}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: isPending
                      ? "linear-gradient(135deg, rgba(168,214,128,0.3), rgba(109,174,74,0.22))"
                      : "rgba(255,255,255,0.6)",
                    border: isPending
                      ? "1.5px solid rgba(109,174,74,0.65)"
                      : "1px solid rgba(109,174,74,0.25)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: team.leaderAvatar,
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 700,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {team.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: fg }}>
                        {team.name}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(168,214,128,0.35)",
                          color: "#3d7a2e",
                          fontFamily: "monospace",
                        }}
                      >
                        {team.id}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                      組長：{team.leader}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: isPending
                        ? "transparent"
                        : "linear-gradient(135deg, #8dc968, #6dae4a)",
                      border: isPending ? "1.5px solid #4e9a2e" : "none",
                      color: isPending ? "#3d7a2e" : "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {isPending ? "✓ 已選" : "選擇"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </FormShell>
  );
}

// Success overlay after submission
// ─── App ──────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState("landing");
  const [rewardsFrom, setRewardsFrom] = useState("home");
  const navigateTo = (next) => {
    if (next === "rewards") setRewardsFrom(screen === "me" ? "me" : "home");
    setScreen(next);
  };
  const [user, setUser] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [tasks, setTasks] = useState(TASKS);
  const [successData, setSuccessData] = useState(null);
  const [ledTeam, setLedTeam] = useState(null);
  const [joinedTeam, setJoinedTeam] = useState(null);

  const openTask = (id) => {
    setCurrentTaskId(id);
    setScreen("taskDetail");
  };
  const openTaskForm = (id) => {
    setCurrentTaskId(id);
    setScreen("form");
  };

  const userIdFromEmail = (email) =>
    "U" +
    (email || "guest@x.com")
      .split("@")[0]
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
      .padEnd(4, "0");

  const handleSignIn = (rawUser) => {
    const uid = userIdFromEmail(rawUser.email);
    const fullUser = { ...rawUser, id: uid };
    setUser(fullUser);
    // Route new users to profile setup first
    setScreen("profileSetup");
  };

  const handleProfileComplete = (profile) => {
    setUser((prev) => {
      const merged = {
        ...prev,
        name: profile.zhName || prev.name,
        zhName: profile.zhName,
        enName: profile.enName,
        nickname: profile.nickname,
        phone: profile.phone,
        phoneCode: profile.phoneCode,
        lineId: profile.lineId,
        telegramId: profile.telegramId,
        country: profile.country,
        location: profile.location,
      };
      const displayName = merged.name;
      // Auto-create the user's own team
      const myTeam = {
        id: "T-" + prev.id.replace(/^U/, ""),
        role: "leader",
        name: `${displayName}的團隊`,
        topic: "尚未指定主題",
        leader: {
          id: prev.id,
          name: displayName,
          avatar: "linear-gradient(135deg, #fed234, #fec701, #fec701)",
        },
        members: [],
        requests: [
          {
            id: "req1",
            name: "林詠瑜",
            avatar: "linear-gradient(135deg, #fed234, #fec701)",
          },
          {
            id: "req2",
            name: "陳志豪",
            avatar: "linear-gradient(135deg, #fec701, #B8A4E3)",
          },
          {
            id: "req3",
            name: "王美玲",
            avatar: "linear-gradient(135deg, #8AD4B0, #fec701)",
          },
        ],
      };
      setLedTeam(myTeam);
      syncTeamTask(myTeam, null);
      setScreen("home");
      return merged;
    });
  };

  const handleProfileUpdate = (profile) => {
    setUser((prev) => ({
      ...prev,
      name: profile.zhName || prev.name,
      zhName: profile.zhName,
      enName: profile.enName,
      nickname: profile.nickname,
      phone: profile.phone,
      phoneCode: profile.phoneCode,
      lineId: profile.lineId,
      telegramId: profile.telegramId,
      country: profile.country,
      location: profile.location,
    }));
    setScreen("profile");
  };

  const handleSignOut = () => {
    setUser(null);
    setLedTeam(null);
    setJoinedTeam(null);
    setScreen("landing");
  };

  // Compute team progress for task 3 from BOTH teams
  const syncTeamTask = (led, joined) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === 3);
      if (idx < 0) return prev;
      const t = prev[idx];
      const cap = t.cap || 6;
      const ledTotal = led ? led.members.length + 1 : 0;
      const joinedTotal =
        joined && joined.status === "approved"
          ? (joined.currentCount || 0) + 1
          : 0;
      // Highest total wins for the task
      const total = Math.max(ledTotal, joinedTotal);
      const complete = total >= cap;
      const updated = {
        ...t,
        status:
          !led && !joined ? "todo" : complete ? "completed" : "in_progress",
        progress: Math.min(1, total / cap),
        teamProgress:
          led || joined ? { total, cap, ledTotal, joinedTotal } : null,
      };
      const n = [...prev];
      n[idx] = updated;
      return n;
    });
  };

  // Joining a team only — every user already leads their own team
  const joinTeam = (teamData) => {
    const newTeam = { ...teamData, role: "member" };
    setJoinedTeam(newTeam);
    syncTeamTask(ledTeam, newTeam);
    setSuccessData({
      color: "#6dae4a",
      points: 0,
      bonus: `已向「${newTeam.name}」送出申請，等待組長審核`,
      title: "申請已送出！",
    });
    setScreen("me");
  };

  const leaveLedTeam = () => {
    setLedTeam(null);
    syncTeamTask(null, joinedTeam);
  };
  const leaveJoinedTeam = () => {
    setJoinedTeam(null);
    syncTeamTask(ledTeam, null);
  };

  const approveRequest = (reqId) => {
    if (!ledTeam) return;
    const req = (ledTeam.requests || []).find((r) => r.id === reqId);
    if (!req) return;
    const updated = {
      ...ledTeam,
      members: [
        ...ledTeam.members,
        { id: req.id, name: req.name, avatar: req.avatar },
      ],
      requests: ledTeam.requests.filter((r) => r.id !== reqId),
    };
    setLedTeam(updated);
    syncTeamTask(updated, joinedTeam);
    if (updated.members.length + 1 >= 6) {
      const t3 = tasks.find((x) => x.id === 3);
      setSuccessData({
        color: t3.color,
        points: t3.points,
        bonus: t3.bonus,
        title: "組隊完成！",
      });
    }
  };

  const rejectRequest = (reqId) => {
    if (!ledTeam) return;
    setLedTeam({
      ...ledTeam,
      requests: (ledTeam.requests || []).filter((r) => r.id !== reqId),
    });
  };

  const renameTeam = (alias) => {
    if (!ledTeam) return;
    setLedTeam({ ...ledTeam, alias });
  };

  // Demo helper: simulate a member's request being approved externally
  const simulateJoinApproved = () => {
    if (!joinedTeam || joinedTeam.status !== "pending") return;
    const approved = { ...joinedTeam, status: "approved" };
    setJoinedTeam(approved);
    syncTeamTask(ledTeam, approved);
  };

  const completeTask = (id) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const t = tasks[idx];
    const updated = {
      ...t,
      status: "completed",
      steps: (t.steps || []).map((s) => ({ ...s, done: true })),
      progress: 1,
    };
    const newTasks = [...tasks];
    newTasks[idx] = updated;
    setTasks(newTasks);
    setScreen("taskDetail");
    setSuccessData({ color: t.color, points: t.points, bonus: t.bonus });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "#F2ECDC",
        fontFamily: '"Noto Sans SC", "PingFang SC", -apple-system, sans-serif',
        overflow: "hidden",
      }}
    >
      <GlobalStyles />
      {screen === "landing" && (
        <LandingScreen
          onStart={() => setScreen("auth")}
        />
      )}
      {screen === "auth" && (
        <GoogleAuthScreen
          onCancel={() => setScreen("landing")}
          onSuccess={handleSignIn}
        />
      )}
      {screen === "profileSetup" && (
        <ProfileSetupForm
          user={user}
          onCancel={() => {
            setUser(null);
            setScreen("landing");
          }}
          onSubmit={handleProfileComplete}
        />
      )}
      {screen === "profile" && (
        <ProfileScreen
          user={user}
          onBack={() => setScreen("me")}
          onEdit={() => setScreen("profileEdit")}
        />
      )}
      {screen === "profileEdit" && (
        <ProfileSetupForm
          user={user}
          initial={user}
          title="編輯個人資料"
          subtitle="更新你的基本資訊"
          submitLabel="儲存變更"
          onCancel={() => setScreen("profile")}
          onSubmit={handleProfileUpdate}
        />
      )}
      {screen === "home" && (
        <HomeScreen
          user={user}
          tasks={tasks}
          onSignOut={handleSignOut}
          onNavigate={navigateTo}
          onOpenTask={openTask}
        />
      )}
      {screen === "tasks" && (
        <TasksScreen
          tasks={tasks}
          onNavigate={setScreen}
          onOpenTask={openTask}
        />
      )}
      {screen === "rank" && (
        <RankScreen
          user={user}
          tasks={tasks}
          onNavigate={setScreen}
        />
      )}
      {screen === "taskDetail" && (
        <TaskDetailScreen
          tasks={tasks}
          taskId={currentTaskId}
          onBack={() => setScreen("tasks")}
          onOpenTask={openTask}
          onStartTask={openTaskForm}
          onGoMe={() => setScreen("me")}
        />
      )}
      {screen === "form" && currentTaskId === 1 && (
        <InterestForm
          onCancel={() => setScreen("taskDetail")}
          onSubmit={() => completeTask(1)}
        />
      )}
      {screen === "form" && currentTaskId === 2 && (
        <TicketForm
          onCancel={() => setScreen("taskDetail")}
          onSubmit={() => completeTask(2)}
        />
      )}
      {screen === "form" && currentTaskId === 3 && (
        <TeamForm
          onCancel={() => setScreen("me")}
          onSubmit={joinTeam}
        />
      )}
      {screen === "me" && (
        <MyScreen
          user={user}
          ledTeam={ledTeam}
          joinedTeam={joinedTeam}
          tasks={tasks}
          onSignOut={handleSignOut}
          onNavigate={navigateTo}
          onBuildTeam={() => {
            setCurrentTaskId(3);
            setScreen("form");
          }}
          onApproveRequest={approveRequest}
          onRejectRequest={rejectRequest}
          onRenameTeam={renameTeam}
          onCancelJoinRequest={leaveJoinedTeam}
          onLeaveLedTeam={leaveLedTeam}
          onLeaveJoinedTeam={leaveJoinedTeam}
          onSimulateJoinApproved={simulateJoinApproved}
          onOpenTask={openTask}
        />
      )}
      {screen === "rewards" && (
        <RewardsScreen
          user={user}
          tasks={tasks}
          onBack={() => setScreen(rewardsFrom)}
        />
      )}
      {successData && (
        <FormSuccessOverlay
          {...successData}
          onDone={() => setSuccessData(null)}
        />
      )}
    </div>
  );
}

export default App;
