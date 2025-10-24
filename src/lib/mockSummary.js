import { promises as fs } from "fs";
import path from "path";

const DB_FILE_PATH = path.join(process.cwd(), "db.json");
const DEFAULT_VOUCHER_IMAGE = "/sample-voucher.jpg";
const CATEGORY_ICONS = {
  "eco-action": "🌿",
  health: "💪",
  learning: "📘",
};
const VOUCHER_IMAGES = {
  "voucher-001": "/sample-voucher.jpg",
  "voucher-002": "/sample-voucher.jpg",
  "voucher-003": "/sample-voucher.jpg",
  "voucher-004": "/sample-voucher.jpg",
  "voucher-005": "/sample-voucher.jpg",
};

function getInitials(source) {
  if (!source) return "T";
  const cleaned = source.replace(/[^a-zA-Z\s]/g, " ").trim();
  if (!cleaned) return "T";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${second}`.toUpperCase() || first.toUpperCase() || "T";
}

function resolvePhotoUrl(user) {
  if (user?.photo_url) return user.photo_url;
  const base = getInitials(user?.username ?? user?.email ?? user?.name ?? "Teman Herbit");
  const params = new URLSearchParams({
    name: base,
    background: "FACC15",
    color: "ffffff",
    size: "128",
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}

export async function loadMockData() {
  const file = await fs.readFile(DB_FILE_PATH, "utf8");
  return JSON.parse(file);
}

function getPrimaryUser(db) {
  return (
    db.users?.find((user) => user.id === "user-001") ?? db.users?.[0] ?? null
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDateLabel(dateString, withTime = false) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: withTime ? "numeric" : undefined,
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  }).format(date);
}

function getLatestTasks(db, userId) {
  const tasks = (db.daily_tasks ?? []).filter(
    (task) => task.user_id === userId
  );
  if (!tasks.length) return { date: null, items: [] };
  const latestDate = tasks.reduce(
    (latest, task) => (latest > task.task_date ? latest : task.task_date),
    tasks[0].task_date
  );
  const items = tasks
    .filter((task) => task.task_date === latestDate)
    .map((task) => {
      const checklist = (db.daily_task_checklist ?? []).find(
        (entry) => entry.daily_task_id === task.id && entry.user_id === userId
      );
      const done = Boolean(checklist?.is_completed);
      const icon = CATEGORY_ICONS[task.category] ?? "🌱";
      return {
        id: task.id,
        title: task.title,
        done,
        status: done ? "Selesai" : "Belum dikerjakan",
        icon,
      };
    });
  return { date: latestDate, items };
}

function buildHomeSummary(db) {
  const user = getPrimaryUser(db);
  if (!user) return null;

  const { date: latestDate, items: habits } = getLatestTasks(db, user.id);
  const totalTasks = habits.length;
  const completedTasks = habits.filter((habit) => habit.done).length;
  const progressPercent = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const project = (db.ecoenzim_projects ?? []).find(
    (item) => item.user_id === user.id
  );
  let ecoenzym = null;
  if (project) {
    const reference = new Date(
      latestDate ??
        project.updated_at ??
        project.last_activity_date ??
        project.start_date ??
        Date.now()
    );
    const start = new Date(project.start_date ?? reference);
    const end = new Date(project.end_date ?? reference);
    const totalDuration = Math.max(end - start, 1);
    const elapsed = clamp(reference - start, 0, totalDuration);
    const uploads = (db.ecoenzim_upload_progress ?? []).filter(
      (entry) => entry.user_id === user.id
    );
    ecoenzym = {
      projectId: project.id,
      batch: `Eco Enzym #${project.id.split("-").pop()}`,
      status: project.status,
      progressPercent: Math.round((elapsed / totalDuration) * 100),
      monthNumber: uploads.length,
      daysRemaining: Math.max(
        Math.ceil((end - reference) / (1000 * 60 * 60 * 24)),
        0
      ),
    };
  }

  const vouchers = Array.isArray(db.vouchers) ? db.vouchers.slice(0, 2) : [];
  const rewardsBanners = vouchers.map((voucher) => ({
    id: voucher.id,
    image: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
    alt: voucher.name,
    href: "#",
  }));

  return {
    user: {
      id: user.id,
      name: user.username ?? user.email ?? "Teman Herbit",
      photo_url: resolvePhotoUrl(user),
      total_points: user.total_points ?? 0,
    },
    progress: {
      date: latestDate,
      total: totalTasks,
      completed: completedTasks,
      percent: progressPercent,
    },
    ecoenzym,
    rewardsBanners,
    habitsToday: habits.slice(0, 3),
  };
}

function buildActivities(db, user) {
  const tasksMap = new Map(
    (db.daily_tasks ?? []).map((task) => [task.id, task])
  );
  const activities = [];

  (db.daily_task_checklist ?? [])
    .filter((entry) => entry.user_id === user.id)
    .forEach((entry) => {
      const task = tasksMap.get(entry.daily_task_id);
      if (!task) return;
      const dateValue = entry.completed_at ?? task.task_date;
      activities.push({
        id: `task-${entry.id}`,
        type: "gain",
        points: task.points_reward ?? 0,
        title: task.title,
        description: task.description,
        timeLabel: formatDateLabel(dateValue, true),
        _sortDate: dateValue,
        periods: ["all", "week", "month"],
      });
    });

  (db.ecoenzim_upload_progress ?? [])
    .filter((entry) => entry.user_id === user.id)
    .forEach((entry) => {
      const dateValue = entry.uploaded_date ?? entry.created_at;
      activities.push({
        id: entry.id,
        type: "gain",
        pre_points: entry.pre_points_earned ?? 0,
        title: `Upload progres eco-enzim bulan ke-${entry.month_number}`,
        description: "Progress eco-enzim terverifikasi",
        timeLabel: formatDateLabel(dateValue, true),
        _sortDate: dateValue,
        periods: ["all", "month"],
      });
    });

  const voucherMap = new Map(
    (db.vouchers ?? []).map((voucher) => [voucher.id, voucher])
  );
  (db.voucher_redemptions ?? [])
    .filter((entry) => entry.user_id === user.id)
    .forEach((entry) => {
      const voucher = voucherMap.get(entry.voucher_id);
      const dateValue = entry.redeemed_at ?? entry.created_at;
      activities.push({
        id: entry.id,
        type: "redeem",
        points: -(entry.points_deducted ?? 0),
        title: `Tukar voucher ${voucher?.name ?? "Reward"}`,
        description: voucher?.description ?? "Voucher berhasil ditukar",
        timeLabel: formatDateLabel(dateValue, true),
        _sortDate: dateValue,
        periods: ["all", "month"],
      });
    });

  activities.sort((a, b) => {
    const dateA = new Date(a._sortDate ?? 0);
    const dateB = new Date(b._sortDate ?? 0);
    return dateB - dateA;
  });

  return activities.map(({ _sortDate, ...activity }) => activity);
}

function computeStreak(db, userId) {
  const completedDates = Array.from(
    new Set(
      (db.daily_task_checklist ?? [])
        .filter((entry) => entry.user_id === userId && entry.is_completed)
        .map((entry) => (entry.completed_at ?? entry.created_at)?.split("T")[0])
    )
  ).filter(Boolean);
  if (!completedDates.length) return 0;
  const sorted = completedDates
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);
  let streak = 0;
  let cursor = sorted[0];
  for (const date of sorted) {
    const diff = Math.round((cursor - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 1000 * 60 * 60 * 24);
    } else if (diff === 1) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 1000 * 60 * 60 * 24);
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

function buildRewardsSummary(db, user) {
  const streakDays = computeStreak(db, user.id);
  const milestone = {
    title: "Congrats!",
    subtitle: "30 hari konsisten!",
    description:
      "Kamu berhasil menyelesaikan minimal satu task setiap hari selama sebulan.",
    image: "/robot.svg",
    progress: {
      current: clamp(streakDays, 0, 30),
      target: 30,
    },
    ctaLabel: "Klaim reward",
    ctaPoints: 50,
    claimed: Boolean(
      db.milestone_claims?.some((claim) => claim.user_id === user.id)
    ),
  };

  const vouchers = (db.vouchers ?? []).filter((voucher) => voucher.is_active);
  const available = vouchers.map((voucher) => ({
    id: voucher.id,
    name: voucher.name,
    description: voucher.description,
    image: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
    banner: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
    points_required: voucher.points_required,
    progress: {
      current: user.total_points ?? 0,
      target: voucher.points_required ?? 1,
    },
  }));

  const voucherMap = new Map(vouchers.map((voucher) => [voucher.id, voucher]));
  const history = (db.voucher_redemptions ?? [])
    .filter((entry) => entry.user_id === user.id)
    .map((entry) => {
      const voucher = voucherMap.get(entry.voucher_id);
      return {
        id: entry.id,
        name: voucher?.name ?? "Voucher",
        image: VOUCHER_IMAGES[voucher?.id] ?? DEFAULT_VOUCHER_IMAGE,
        redeemed_at: entry.redeemed_at?.split("T")[0] ?? entry.redeemed_at,
        points: entry.points_deducted ?? 0,
      };
    });

  return { milestone, available, history };
}

export function buildProfileSummary(db) {
  const user = getPrimaryUser(db);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      name: user.username ?? user.email ?? "Teman Herbit",
      photo_url: resolvePhotoUrl(user),
      total_points: user.total_points ?? 0,
    },
    tabs: [
      { id: "activities", label: "Aktivitas" },
      { id: "rewards", label: "Rewards" },
    ],
    activity_filters: [
      { id: "all", label: "Semua" },
      { id: "week", label: "Minggu ini", active: true },
      { id: "month", label: "Bulan ini" },
    ],
    activities: buildActivities(db, user),
    rewards: buildRewardsSummary(db, user),
  };
}

export function buildHomeSummaryResponse(db) {
  const summary = buildHomeSummary(db);
  if (!summary) throw new Error("Unable to build home summary");
  return summary;
}
