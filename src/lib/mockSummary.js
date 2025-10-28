import { promises as fs } from "fs";
import path from "path";
import apiClient from "./apiClient";

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
const API_BASE_URL = apiClient?.defaults?.baseURL ?? "";
const RAW_TOKEN =
  process.env.VOUCHER_API_TOKEN ??
  process.env.NEXT_PUBLIC_MOCK_TOKEN ??
  null;
const AUTH_HEADER = RAW_TOKEN
  ? RAW_TOKEN.startsWith("Bearer ")
    ? RAW_TOKEN
    : `Bearer ${RAW_TOKEN}`
  : null;

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
  if (user?.photoUrl) return user.photoUrl;
  if (user?.photo_url) return user.photo_url;
  const base = getInitials(
    user?.username ?? user?.email ?? user?.name ?? "Teman Herbit"
  );
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

async function fetchVoucherList(limit = 5, username) {
  if (!API_BASE_URL) return null;
  try {
    const response = await apiClient.get("/vouchers", {
      params: {
        limit,
        ...(username ? { username } : {}),
      },
      headers: AUTH_HEADER ? { Authorization: AUTH_HEADER } : undefined,
    });
    return response.data?.data?.items ?? null;
  } catch (error) {
    console.error("fetchVoucherList failed:", error?.message ?? error);
    return null;
  }
}

async function fetchRewardSummary(username) {
  if (!API_BASE_URL) return null;
  try {
    const response = await apiClient.get("/rewards/summary", {
      params: username ? { username } : undefined,
      headers: AUTH_HEADER ? { Authorization: AUTH_HEADER } : undefined,
    });
    return response.data?.data ?? null;
  } catch (error) {
    console.error("fetchRewardSummary failed:", error?.message ?? error);
    return null;
  }
}

async function fetchCurrentUser() {
  if (!API_BASE_URL) return null;
  try {
    const response = await apiClient.get("/auth/me", {
      headers: AUTH_HEADER ? { Authorization: AUTH_HEADER } : undefined,
    });
    const data = response.data?.data ?? response.data ?? null;
    if (!data) return null;
    return {
      id: data.id ?? data._id ?? null,
      username: data.username ?? null,
      email: data.email ?? null,
      photoUrl: data.photoUrl ?? data.photo_url ?? null,
      totalPoints: data.totalPoints ?? data.total_points ?? 0,
      prePoints: data.prePoints ?? data.pre_points ?? 0,
    };
  } catch (error) {
    console.error("fetchCurrentUser failed:", error?.message ?? error);
    return null;
  }
}

function getPrimaryUser(db, username) {
  if (username) {
    const matched = db.users?.find((user) =>
      user.username === username || user.email === username || user.id === username
    );
    if (matched) {
      return matched;
    }
  }
  return (
    db.users?.find((user) => user.id === "user-001") ?? db.users?.[0] ?? null
  );
}

function mergeUserData(remoteUser, fallbackUser) {
  if (!remoteUser && !fallbackUser) return null;
  const base = fallbackUser ?? {};
  const remote = remoteUser ?? {};
  const id = remote.id ?? remote._id ?? base.id ?? base._id ?? null;
  const username = remote.username ?? base.username ?? null;
  const email = remote.email ?? base.email ?? null;
  const hasRemote = Boolean(remoteUser);

  const remotePhoto =
    remote.photoUrl !== undefined
      ? remote.photoUrl
      : remote.photo_url !== undefined
      ? remote.photo_url
      : undefined;
  const photoUrl =
    hasRemote && remotePhoto !== undefined
      ? remotePhoto
      : base.photoUrl ?? base.photo_url ?? null;

  const remoteTotalPoints =
    remote.totalPoints !== undefined
      ? remote.totalPoints
      : remote.total_points !== undefined
      ? remote.total_points
      : undefined;
  const totalPoints =
    hasRemote && remoteTotalPoints !== undefined
      ? remoteTotalPoints
      : base.totalPoints ?? base.total_points ?? 0;

  const remotePrePoints =
    remote.prePoints !== undefined
      ? remote.prePoints
      : remote.pre_points !== undefined
      ? remote.pre_points
      : undefined;
  const prePoints =
    hasRemote && remotePrePoints !== undefined
      ? remotePrePoints
      : base.prePoints ?? base.pre_points ?? 0;

  return {
    ...base,
    ...remote,
    id,
    username,
    email,
    photoUrl,
    photo_url: photoUrl,
    totalPoints,
    total_points: totalPoints,
    prePoints,
    pre_points: prePoints,
  };
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

async function buildHomeSummary(db, username) {
  const [remoteUser, fallbackUser] = await Promise.all([
    fetchCurrentUser(),
    Promise.resolve(getPrimaryUser(db, username)),
  ]);
  const user = mergeUserData(remoteUser, fallbackUser);
  if (!user) return null;
  const targetUsername = username ?? remoteUser?.username ?? undefined;

  const { date: latestDate, items: habits } = getLatestTasks(db, user.id);
  const totalTasks = habits.length;
  const completedTasks = habits.filter((habit) => habit.done).length;
  const progressPercent = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const ecoenzymProjects =
    db.ecoenzymProjects ?? db.ecoenzim_projects ?? [];
  const project = ecoenzymProjects.find(
    (item) => (item.user_id ?? item.userId) === user.id
  );
  let ecoenzym = null;
  if (project) {
    const projectId = project.id ?? project._id ?? "ecoenzym-project";
    const projectStart =
      project.start_date ?? project.startDate ?? Date.now();
    const projectEnd =
      project.end_date ?? project.endDate ?? projectStart;
    const projectUpdated =
      project.updated_at ?? project.updatedAt ?? projectStart;
    const projectLastActivity =
      project.last_activity_date ?? project.lastActivityDate ?? projectUpdated;
    const reference = new Date(
      latestDate ??
        projectUpdated ??
        projectLastActivity ??
        projectStart ??
        Date.now()
    );
    const start = new Date(projectStart ?? reference);
    const end = new Date(projectEnd ?? reference);
    const totalDuration = Math.max(end - start, 1);
    const elapsed = clamp(reference - start, 0, totalDuration);
    const ecoenzymUploads =
      db.ecoenzymUploadProgress ?? db.ecoenzim_upload_progress ?? [];
    const uploads = ecoenzymUploads.filter(
      (entry) => (entry.user_id ?? entry.userId) === user.id
    );
    ecoenzym = {
      projectId,
      batch: `Eco Enzym #${projectId.toString().split("-").pop()}`,
      status: project.status ?? project.state ?? "ongoing",
      progressPercent: Math.round((elapsed / totalDuration) * 100),
      monthNumber: uploads.length,
      daysRemaining: Math.max(
        Math.ceil((end - reference) / (1000 * 60 * 60 * 24)),
        0
      ),
    };
  }

  let rewardsBanners = [];
  const remoteVouchers = await fetchVoucherList(3, targetUsername);
  if (Array.isArray(remoteVouchers) && remoteVouchers.length) {
    rewardsBanners = remoteVouchers.map((voucher) => ({
      id: voucher.id ?? voucher.slug ?? voucher._id,
      image:
        voucher.banner ??
        voucher.bannerUrl ??
        voucher.image ??
        voucher.imageUrl ??
        DEFAULT_VOUCHER_IMAGE,
      alt: voucher.name ?? "Voucher",
      href: voucher.landingUrl ?? "#",
    }));
  } else {
    const vouchers = Array.isArray(db.vouchers) ? db.vouchers.slice(0, 2) : [];
    rewardsBanners = vouchers.map((voucher) => ({
      id: voucher.id,
      image: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
      alt: voucher.name,
      href: "#",
    }));
  }

  return {
    user: {
      id: user.id,
      name: user.username ?? user.email ?? "Teman Herbit",
      photoUrl: resolvePhotoUrl(user),
      totalPoints: user.total_points ?? user.totalPoints ?? 0,
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

  const tasksByDate = new Map();
  (db.daily_tasks ?? [])
    .filter((task) => task.user_id === user.id)
    .forEach((task) => {
      const list = tasksByDate.get(task.task_date) ?? [];
      list.push(task);
      tasksByDate.set(task.task_date, list);
    });

  const completedChecklists = (db.daily_task_checklist ?? []).filter(
    (entry) => entry.user_id === user.id && entry.is_completed
  );
  const checklistByTaskId = new Map(
    completedChecklists.map((entry) => [entry.daily_task_id, entry])
  );
  const completedByDate = new Map();
  completedChecklists.forEach((entry) => {
    const task = tasksMap.get(entry.daily_task_id);
    if (!task) return;
    const list = completedByDate.get(task.task_date) ?? [];
    list.push(entry);
    completedByDate.set(task.task_date, list);
  });

  for (const [date, tasksInDay] of tasksByDate.entries()) {
    const completedEntries = completedByDate.get(date) ?? [];
    const allCompleted =
      tasksInDay.length > 0 && completedEntries.length === tasksInDay.length;

    if (allCompleted) {
      const latestCompletion = completedEntries
        .map((entry) => entry.completed_at ?? entry.created_at ?? date)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      activities.push({
        id: `daily-${date}`,
        type: "leaf",
        metricLabel: "+5 daun hijau",
        title: "Daily Habits sempurna!",
        description: "Semua daily habits terselesaikan hari ini.",
        timeLabel: formatDateLabel(latestCompletion ?? date, true),
        _sortDate: latestCompletion ?? date,
        periods: ["all", "week", "month"],
      });
      continue;
    }

    tasksInDay.forEach((task) => {
      const checklist = checklistByTaskId.get(task.id);
      if (!checklist) return;
      const dateValue = checklist.completed_at ?? task.task_date;
      const alreadyCollected = activities.some(
        (activity) => activity._sortDate === dateValue && activity.type === "leaf" && activity.metricLabel === "+1 daun hijau"
      );
      if (alreadyCollected) {
        return;
      }
      activities.push({
        id: `task-${checklist.id}`,
        type: "leaf",
        metricLabel: "+1 daun hijau",
        title: task.title,
        description:
          task.description ?? "Task selesai, pohonmu bertambah subur.",
        timeLabel: formatDateLabel(dateValue, true),
        _sortDate: dateValue,
        periods: ["all", "week", "month"],
      });
    });
  }

  (db.ecoenzymUploadProgress ?? db.ecoenzim_upload_progress ?? [])
    .filter((entry) => (entry.user_id ?? entry.userId) === user.id)
    .forEach((entry) => {
      const dateValue =
        entry.uploaded_date ??
        entry.uploadedDate ??
        entry.created_at ??
        entry.createdAt;
      const monthNumber = entry.month_number ?? entry.monthNumber ?? "-";
      activities.push({
        id: entry.id ?? entry._id ?? `eco-upload-${monthNumber}-${user.id}`,
        type: "gain",
        prePoints:
          entry.pre_points_earned ??
          entry.prePointsEarned ??
          entry.prePoints ??
          0,
        title: `Upload progres eco-enzym bulan ke-${monthNumber}`,
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
        points: -(entry.points_deducted ?? entry.pointsDeducted ?? 0),
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

async function buildRewardsSummary(db, user, remoteSummary) {
  const streakDays = computeStreak(db, user.id);
  const remoteUser = remoteSummary?.user ?? null;
  const userPoints =
    remoteUser?.totalPoints ??
    user.totalPoints ??
    user.total_points ??
    0;
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

  let available = [];
  let history = [];

  if (Array.isArray(remoteSummary?.available)) {
    available = remoteSummary.available.map((voucher) => {
      const pointsRequired = voucher.pointsRequired ?? 0;
      const current = voucher.progress?.current ?? userPoints;
      const target = voucher.progress?.target ?? (pointsRequired || 1);
      return {
        id: voucher.id ?? voucher.slug,
        name: voucher.name,
        description: voucher.description,
        image:
          voucher.image ??
          voucher.imageUrl ??
          VOUCHER_IMAGES[voucher.id] ??
          DEFAULT_VOUCHER_IMAGE,
        banner:
          voucher.banner ??
          voucher.bannerUrl ??
          voucher.image ??
          voucher.imageUrl ??
          DEFAULT_VOUCHER_IMAGE,
        pointsRequired,
        discountValue: voucher.discountValue,
        stock: voucher.stock,
        landingUrl: voucher.landingUrl,
        canRedeem: voucher.canRedeem,
        progress: {
          current,
          target,
          percent:
            voucher.progress?.percent ??
            Math.min(100, Math.round((current / Math.max(target, 1)) * 100)),
        },
      };
    });
  } else if (remoteSummary?.available === null) {
    available = [];
  } else {
    const vouchers = (db.vouchers ?? []).filter(
      (voucher) => voucher.is_active ?? voucher.isActive
    );
    available = vouchers.map((voucher) => {
      const pointsRequired = voucher.pointsRequired ?? voucher.points_required ?? 0;
      return {
        id: voucher.id,
        name: voucher.name,
        description: voucher.description,
        image: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
        banner: VOUCHER_IMAGES[voucher.id] ?? DEFAULT_VOUCHER_IMAGE,
        pointsRequired,
        discountValue: voucher.discountValue ?? voucher.discount_value,
        stock: voucher.stock,
        validFrom: voucher.validFrom ?? voucher.valid_from,
        validUntil: voucher.validUntil ?? voucher.valid_until,
        isActive: voucher.isActive ?? voucher.is_active ?? true,
        progress: {
          current: userPoints,
          target: pointsRequired || 1,
        },
      };
    });

    const voucherMap = new Map(vouchers.map((voucher) => [voucher.id, voucher]));
    history = (db.voucher_redemptions ?? [])
      .filter((entry) => entry.user_id === user.id)
      .map((entry) => {
        const voucher = voucherMap.get(entry.voucher_id);
        return {
          id: entry.id,
          name: voucher?.name ?? "Voucher",
          image: VOUCHER_IMAGES[voucher?.id] ?? DEFAULT_VOUCHER_IMAGE,
          redeemedAt: entry.redeemed_at?.split("T")[0] ?? entry.redeemed_at,
          points: entry.points_deducted ?? entry.pointsDeducted ?? 0,
        };
      });
  }

  if (
    Array.isArray(remoteSummary?.history) &&
    remoteSummary.history.length > 0
  ) {
    history = remoteSummary.history.map((entry) => ({
      id: entry.id,
      name: entry.name ?? "Voucher",
      image:
        entry.image ??
        entry.imageUrl ??
        VOUCHER_IMAGES[entry.voucherId] ??
        DEFAULT_VOUCHER_IMAGE,
      redeemedAt: entry.redeemedAt,
      points: entry.pointsDeducted ?? entry.points ?? 0,
      code: entry.code,
      status: entry.status,
    }));
  }

  return { milestone, available, history };
}

export async function buildProfileSummary(db, username) {
  const [remoteCurrentUser, fallbackUser] = await Promise.all([
    fetchCurrentUser(),
    Promise.resolve(getPrimaryUser(db, username)),
  ]);

  const baseUser = mergeUserData(remoteCurrentUser, fallbackUser);
  if (!baseUser) return null;

  const targetUsername = username ?? baseUser.username ?? undefined;
  const remoteSummary = await fetchRewardSummary(targetUsername);

  const summaryUser = mergeUserData(
    remoteSummary?.user
      ? {
          id: remoteSummary.user.id ?? remoteSummary.user._id ?? null,
          username:
            remoteSummary.user.username ??
            remoteSummary.user.email ??
            null,
          email: remoteSummary.user.email ?? null,
          photoUrl:
            remoteSummary.user.photoUrl ??
            remoteSummary.user.photo_url ??
            null,
          totalPoints:
            remoteSummary.user.totalPoints ??
            remoteSummary.user.total_points ??
            null,
          prePoints:
            remoteSummary.user.prePoints ??
            remoteSummary.user.pre_points ??
            null,
        }
      : null,
    baseUser
  );

  const mergedUser = {
    id: summaryUser.id,
    username:
      summaryUser.username ??
      summaryUser.email ??
      "teman-herbit",
    name:
      remoteSummary?.user?.name ??
      summaryUser.username ??
      summaryUser.email ??
      "Teman Herbit",
    photoUrl:
      summaryUser.photoUrl ??
      resolvePhotoUrl({
        ...summaryUser,
        photoUrl: summaryUser.photoUrl ?? summaryUser.photo_url,
      }),
    totalPoints: summaryUser.totalPoints ?? 0,
  };

  return {
    user: mergedUser,
    tabs: [
      { id: "activities", label: "Aktivitas" },
      { id: "rewards", label: "Rewards & Vouchers" },
    ],
    activityFilters: [
      { id: "all", label: "Semua" },
      { id: "week", label: "Minggu ini", active: true },
      { id: "month", label: "Bulan ini" },
    ],
    activities: buildActivities(db, summaryUser),
    rewards: await buildRewardsSummary(db, summaryUser, remoteSummary),
  };
}

export async function buildHomeSummaryResponse(db, username) {
  const summary = await buildHomeSummary(db, username);
  if (!summary) throw new Error("Unable to build home summary");
  return summary;
}
