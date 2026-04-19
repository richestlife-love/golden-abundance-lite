// React app page — 金富有志工
// Full-viewport mobile-app landing. No device frame. Responsive, CTA always visible.

import { useState } from "react";
import { TASKS } from "./data";
import type { ScreenId, User, Task, SuccessData, Team } from "./types";
import GlobalStyles from "./ui/GlobalStyles";
import FormSuccessOverlay from "./ui/FormSuccessOverlay";
import LandingScreen from "./screens/LandingScreen";
import GoogleAuthScreen from "./screens/GoogleAuthScreen";
import HomeScreen from "./screens/HomeScreen";
import TasksScreen from "./screens/TasksScreen";
import TaskDetailScreen from "./screens/TaskDetailScreen";
import RankScreen from "./screens/RankScreen";
import RewardsScreen from "./screens/RewardsScreen";
import MyScreen from "./screens/MyScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProfileSetupForm from "./screens/ProfileSetupForm";
import InterestForm from "./screens/InterestForm";
import TicketForm from "./screens/TicketForm";
import TeamForm from "./screens/TeamForm";

// ─── App ──────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState<ScreenId>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [currentTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [ledTeam, setLedTeam] = useState<Team | null>(null);
  const [, setJoinedTeam] = useState<Team | null>(null);
const userIdFromEmail = (email: string): string =>
    "U" +
    (email || "guest@x.com")
      .split("@")[0]
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
      .padEnd(4, "0");

  const handleSignIn = (rawUser: Pick<User, "email" | "name" | "avatar">) => {
    const uid = userIdFromEmail(rawUser.email);
    const fullUser: User = { ...rawUser, id: uid };
    setUser(fullUser);
    // Route new users to profile setup first
    setScreen("profileSetup");
  };

  // Compute team progress for task 3 from BOTH teams
  const syncTeamTask = (led: Team | null, joined: Team | null) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === 3);
      if (idx < 0) return prev;
      const t = prev[idx];
      const cap = t.cap || 6;
      const ledTotal = led ? led.members.length + 1 : 0;
      const joinedTotal =
        joined && joined.status === "approved" ? (joined.currentCount || 0) + 1 : 0;
      // Highest total wins for the task
      const total = Math.max(ledTotal, joinedTotal);
      const complete = total >= cap;
      const updated: Task = {
        ...t,
        status: !led && !joined ? "todo" : complete ? "completed" : "in_progress",
        progress: Math.min(1, total / cap),
        teamProgress: led || joined ? { total, cap, ledTotal, joinedTotal } : null,
      };
      const n = [...prev];
      n[idx] = updated;
      return n;
    });
  };

  const handleProfileComplete = (profile: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged: User = {
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
      const myTeam: Team = {
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

  const handleProfileUpdate = (profile: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
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
    });
    setScreen("profile");
  };

  // Joining a team only — every user already leads their own team
  const joinTeam = (teamData: Omit<Team, "role">) => {
    const newTeam: Team = { ...teamData, role: "member" };
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

  const completeTask = (id: number) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const t = tasks[idx];
    const updated: Task = {
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
        background: "var(--bg-shell)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      <GlobalStyles />
      {screen === "landing" && <LandingScreen onStart={() => setScreen("auth")} />}
      {screen === "auth" && (
        <GoogleAuthScreen onCancel={() => setScreen("landing")} onSuccess={handleSignIn} />
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
      {screen === "profile" && <ProfileScreen />}
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
      {screen === "home" && <HomeScreen />}
      {screen === "tasks" && <TasksScreen />}
      {screen === "rank" && <RankScreen />}
      {screen === "taskDetail" && <TaskDetailScreen />}
      {screen === "form" && currentTaskId === 1 && (
        <InterestForm onCancel={() => setScreen("taskDetail")} onSubmit={() => completeTask(1)} />
      )}
      {screen === "form" && currentTaskId === 2 && (
        <TicketForm onCancel={() => setScreen("taskDetail")} onSubmit={() => completeTask(2)} />
      )}
      {screen === "form" && currentTaskId === 3 && (
        <TeamForm onCancel={() => setScreen("me")} onSubmit={joinTeam} />
      )}
      {screen === "me" && <MyScreen />}
      {screen === "rewards" && <RewardsScreen />}
      {successData && <FormSuccessOverlay {...successData} onDone={() => setSuccessData(null)} />}
    </div>
  );
}

export default App;
