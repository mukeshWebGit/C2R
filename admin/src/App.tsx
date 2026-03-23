import React, { useEffect, useState } from "react";
import "./App.css";

type Role = "MASTER" | "ADMIN";
type RouteKey = "dashboard" | "users" | "admins" | "promocodes" | "login";

type AdminMe = { admin: { id: string; email: string; role: Role; name: string } };
type Stats = {
  totalUsers: number;
  usersWithDocuments: number;
  totalAdmins: number;
  totalPromoCodes: number;
  usedPromoCodes: number;
};

type UserDoc = {
  _id: string;
  mobile: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  promoCode?: string;
  giftName?: string;
  giftImage?: string;
  documents?: {
    idProof?: string;
    invoiceCopy?: string;
    scratchCard?: string;
    uploadedAt?: string | null;
  };
};

type PromoDoc = {
  _id: string;
  code?: string;
  gift?: string;
  image?: string;
  used?: boolean;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://c2r-backend.onrender.com";

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_ROLE_KEY = "admin_role";
const ADMIN_NAME_KEY = "admin_name";

const greetingPrefix = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const parseRoute = (pathname: string): RouteKey => {
  const p = pathname.replace(/\/+$/, "");
  if (!p || p === "/") return "login";
  const key = p.replace("/", "") as RouteKey;
  if (
    key === "dashboard" ||
    key === "users" ||
    key === "admins" ||
    key === "promocodes" ||
    key === "login"
  ) {
    return key;
  }
  return "dashboard";
};

const navigateTo = (to: RouteKey) => {
  const newPath = to === "login" ? "/login" : `/${to}`;
  window.history.pushState({}, "", newPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const apiFetch = async <T,>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data as T;
};

const App = () => {
  const [route, setRoute] = useState<RouteKey>(() =>
    parseRoute(window.location.pathname)
  );
  const [token, setToken] = useState<string>(() =>
    localStorage.getItem(ADMIN_TOKEN_KEY) || ""
  );
  const [role, setRole] = useState<Role | "">(() => {
    const r = localStorage.getItem(ADMIN_ROLE_KEY);
    if (r === "MASTER" || r === "ADMIN") return r;
    return "";
  });
  const [adminName, setAdminName] = useState(() =>
    localStorage.getItem(ADMIN_NAME_KEY) || ""
  );

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onRouteGuard = () => {
      if (!token && route !== "login") {
        navigateTo("login");
      }
      if (token && route === "login") {
        navigateTo("dashboard");
      }
    };
    onRouteGuard();
  }, [route, token]);

  useEffect(() => {
    if (!token) return;
    apiFetch<AdminMe>("/api/admin/me", token)
      .then((data) => {
        const r = data?.admin?.role;
        if (r === "MASTER" || r === "ADMIN") setRole(r);
        localStorage.setItem(ADMIN_ROLE_KEY, data.admin.role);
        const n = data?.admin?.name?.trim?.() || "";
        if (n) {
          setAdminName(n);
          localStorage.setItem(ADMIN_NAME_KEY, n);
        }
      })
      .catch(() => {
        // ignore profile fetch errors; route access is enforced by backend
      });
  }, [token]);

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
    setToken("");
    setRole("");
    setAdminName("");
    navigateTo("login");
  };

  const greetingName = adminName.trim() || "Admin";

  const canAccessAdmins = role === "MASTER";

  return (
    <div className="adminShell">
      {route === "login" ? (
        <div className="adminPage">
          <LoginPage
            onLogin={(t, r, name) => {
              setToken(t);
              setRole(r);
              const n = name?.trim() || "";
              setAdminName(n);
              localStorage.setItem(ADMIN_TOKEN_KEY, t);
              localStorage.setItem(ADMIN_ROLE_KEY, r);
              if (n) localStorage.setItem(ADMIN_NAME_KEY, n);
              navigateTo("dashboard");
            }}
          />
        </div>
      ) : route === "dashboard" ? (
        <DashboardPage
          token={token}
          greetingName={greetingName}
          onNavigate={(r) => navigateTo(r)}
          canAccessAdmins={canAccessAdmins}
          onLogout={logout}
        />
      ) : (
        <DashFrame
          activeRoute={route}
          greetingName={greetingName}
          onNavigate={(r) => navigateTo(r)}
          canAccessAdmins={canAccessAdmins}
          onLogout={logout}
        >
          {route === "users" ? (
            <UsersPage token={token} />
          ) : route === "admins" ? (
            canAccessAdmins ? (
              <AdminsPage token={token} />
            ) : (
              <div className="adminCard">
                <h2>Forbidden</h2>
                <p>You don&apos;t have permission to view admins.</p>
              </div>
            )
          ) : route === "promocodes" ? (
            <PromoCodesPage token={token} />
          ) : (
            <DashboardPage
              token={token}
              greetingName={greetingName}
              onNavigate={(r) => navigateTo(r)}
              canAccessAdmins={canAccessAdmins}
              onLogout={logout}
            />
          )}
        </DashFrame>
      )}
    </div>
  );
};

const DashFrame = (props: {
  activeRoute: RouteKey;
  greetingName: string;
  onNavigate: (r: RouteKey) => void;
  canAccessAdmins: boolean;
  onLogout: () => void;
  children: React.ReactNode;
}) => {
  const { activeRoute, onNavigate, canAccessAdmins, children } = props;

  return (
    <div className="dashLayout">
      <aside className="dashSidebar">
        <div className="dashSidebarBrand">
          <div className="dashSidebarLogoMark" aria-hidden="true">
            <span className="dashLogoDot" />
            <span className="dashLogoDot dashLogoDot2" />
          </div>
          <div className="dashSidebarBrandText">Click2redeem</div>
        </div>

        <div className="dashSidebarSectionTitle">Main menu</div>
        <nav className="dashSidebarNav">
          <SidebarItem
            label="Dashboard"
            active={activeRoute === "dashboard"}
            onClick={() => onNavigate("dashboard")}
          />
          <SidebarItem
            label="Users"
            active={activeRoute === "users"}
            onClick={() => onNavigate("users")}
          />
          {canAccessAdmins ? (
            <SidebarItem
              label="Admins"
              active={activeRoute === "admins"}
              onClick={() => onNavigate("admins")}
            />
          ) : null}
          <SidebarItem
            label="Promotions"
            active={activeRoute === "promocodes"}
            onClick={() => onNavigate("promocodes")}
          />
        </nav>
      </aside>

      <div className="dashMain">
        <div className="dashHeader">
          <div className="dashGreeting">
            {greetingPrefix()}, {props.greetingName}!
          </div>
          <div className="dashSearchWrap">
            <input
              className="dashSearch"
              placeholder="Search here..."
              type="search"
            />
          </div>
          <div className="dashHeaderRight">
            
            <div className="dashAvatar" aria-hidden="true" />
            <button className="dashLogoutBtn" type="button" onClick={props.onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="dashContent">{children}</div>
      </div>
    </div>
  );
};

const LoginPage = (props: {
  onLogin: (t: string, r: Role, name: string) => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }
      const t = data?.token;
      const r = data?.role as Role;
      if (!t || (r !== "MASTER" && r !== "ADMIN")) throw new Error("Invalid login response");
      const displayName =
        typeof data?.name === "string" && data.name.trim()
          ? data.name.trim()
          : email.includes("@")
            ? email.split("@")[0]
            : "Admin";
      props.onLogin(t, r, displayName);
    } catch (err: any) {
      setError(err?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="loginTop">
          <div className="loginBrandIcon" aria-hidden="true">
            {/* expects file in admin/public OR root public: /logo.jpg */}
            <img
              src="/logo.jpg"
              alt="Click2redeem logo"
              className="loginBrandImage"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />
          </div>
          <div className="loginTopTitle">Click2redeem Admin</div>
          <div className="loginTopSubtitle">Sign in to continue.</div>
        </div>

        <div className="loginBody">
          <form className="loginForm" onSubmit={submit}>
            <label className="loginLabel">
              Username
              <input
                className="loginInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter username"
                autoComplete="email"
                required
              />
            </label>

            <label className="loginLabel">
              Password
              <input
                className="loginInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </label>

            <div className="loginRow">
              <label className="loginCheck">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="loginLink">
                Forgot password?
              </a>
            </div>

            {error ? <div className="adminErrorBlock">{error}</div> : null}

            <button className="loginButton" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Log In"}{" "}
              <span aria-hidden="true" className="loginArrow">
                ➜
              </span>
            </button>
          </form>

          <div className="loginRegister">
            Don&apos;t have an account?{" "}
            <a href="#" className="loginLink">
              Free Register
            </a>
          </div>

         
        </div>
      </div>
    </div>
  );
};

const DashboardPage = (props: {
  token: string;
  greetingName: string;
  onNavigate: (r: RouteKey) => void;
  canAccessAdmins: boolean;
  onLogout: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch<Stats>("/api/admin/dashboard/stats", props.token),
      apiFetch<{ users: UserDoc[] }>("/api/admin/users", props.token),
    ])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u.users || []);
      })
      .catch((err) => setError(err?.message || "Unable to load dashboard data"))
      .finally(() => setLoading(false));
  }, [props.token]);

  const totalUsers = stats?.totalUsers ?? 0;
  const activeUsers = stats?.usersWithDocuments ?? 0;
  const promosTotal = stats?.totalPromoCodes ?? 0;
  const promosUsed = stats?.usedPromoCodes ?? 0;
  const promoUsedRate =
    promosTotal > 0 ? Math.round((promosUsed / promosTotal) * 1000) / 10 : 0;
  const docsUploaded = activeUsers;

  return (
    <div className="dashLayout">
      <aside className="dashSidebar">
        <div className="dashSidebarBrand">
          <div className="dashSidebarLogoMark" aria-hidden="true">
            <span className="dashLogoDot" />
            <span className="dashLogoDot dashLogoDot2" />
          </div>
          <div className="dashSidebarBrandText">Click2redeem</div>
        </div>

        <div className="dashSidebarSectionTitle">Main menu</div>
        <nav className="dashSidebarNav">
          <SidebarItem
            label="Dashboard"
            active
            onClick={() => props.onNavigate("dashboard")}
          />
          <SidebarItem
            label="Users"
            active={false}
            onClick={() => props.onNavigate("users")}
          />
          {props.canAccessAdmins ? (
            <SidebarItem
              label="Admins"
              active={false}
              onClick={() => props.onNavigate("admins")}
            />
          ) : null}
          <SidebarItem
            label="Promotions"
            active={false}
            onClick={() => props.onNavigate("promocodes")}
          />
        </nav>
      </aside>

      <div className="dashMain">
        <div className="dashHeader">
          <div className="dashGreeting">
            {greetingPrefix()}, {props.greetingName}!
          </div>
          <div className="dashSearchWrap">
            <input
              className="dashSearch"
              placeholder="Search here..."
              type="search"
            />
          </div>
          <div className="dashHeaderRight">
             
            <div className="dashAvatar" aria-hidden="true" />
            <button
              className="dashLogoutBtn"
              type="button"
              onClick={props.onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="dashContent">
          <div className="dashTopCards">
            <MetricCard
              title="Total Users"
              value={totalUsers.toLocaleString()}
              sub="All users in database"
              icon="◈"
            />
            <MetricCard
              title="Active Users"
              value={activeUsers.toLocaleString()}
              sub="Users with uploaded docs"
              icon="◷"
            />
            <MetricCard
              title="Promo Used Rate"
              value={`${promoUsedRate.toFixed(1)}%`}
              sub={promosTotal > 0 ? `${promosUsed} used / ${promosTotal} total` : "No promo codes"}
              icon="◌"
            />
          </div>

          <div className="dashRow">
            <div className="dashCard dashCardWide">
              <div className="dashCardHeader">
                <div className="dashCardTitle">Audience Overview</div>
                <div className="dashCardHeaderRight">This Year ▾</div>
              </div>
              <div className="dashChartWrap">
                <AudienceChart />
              </div>
            </div>

            <div className="dashCard">
              <div className="dashCardHeader">
                <div className="dashCardTitle">New Visitors</div>
                <div className="dashCardHeaderRight">▼</div>
              </div>
              <div className="dashNewVisitorsValue">
                {docsUploaded.toLocaleString()}
              </div>
              <div className="dashBarsWrap">
                <VisitorsBars />
              </div>
              <button className="dashMoreBtn" type="button">
                More Details →
              </button>
            </div>
          </div>

          <div className="dashRow dashRowBottom">
            <div className="dashCard">
              <div className="dashCardHeader">
                <div className="dashCardTitle">
                  Browser Used &amp; Traffic Reports
                </div>
              </div>
              <div className="dashSmallTableWrap">
                <table className="dashSmallTable">
                  <thead>
                    <tr>
                      <th>Browser</th>
                      <th>Sessions</th>
                      <th>Bounce</th>
                      <th>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Chrome</td>
                      <td>{Math.round(totalUsers * 0.52)}</td>
                      <td>52.80%</td>
                      <td>{Math.round(totalUsers * 0.03)}</td>
                    </tr>
                    <tr>
                      <td>Firefox</td>
                      <td>{Math.round(totalUsers * 0.18)}</td>
                      <td>45.60%</td>
                      <td>{Math.round(totalUsers * 0.01)}</td>
                    </tr>
                    <tr>
                      <td>Safari</td>
                      <td>{Math.round(totalUsers * 0.21)}</td>
                      <td>39.20%</td>
                      <td>{Math.round(totalUsers * 0.02)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashCard">
              <div className="dashCardHeader">
                <div className="dashCardTitle">Total Visits</div>
              </div>
              <div className="dashVisitsList">
                <div className="dashVisitRow">
                  <div>
                    <div className="dashVisitLabel">Channel</div>
                    <div className="dashVisitValue">Organic search</div>
                  </div>
                  <div className="dashVisitMetric">10,853 (52.20%)</div>
                </div>
                <div className="dashVisitRow">
                  <div>
                    <div className="dashVisitLabel">Channel</div>
                    <div className="dashVisitValue">Direct</div>
                  </div>
                  <div className="dashVisitMetric">1,082 (4.05%)</div>
                </div>
                <div className="dashVisitRow">
                  <div>
                    <div className="dashVisitLabel">Channel</div>
                    <div className="dashVisitValue">Referral</div>
                  </div>
                  <div className="dashVisitMetric">980 (3.50%)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashCard" style={{ marginTop: 16 }}>
            <div className="dashCardHeader">
              <div className="dashCardTitle">All Users</div>
              <div className="dashCardHeaderRight">{users.length} total</div>
            </div>
            <div className="dashSmallTableWrap dashMaxHeightUsers">
              <table className="dashSmallTable">
                <thead>
                  <tr>
                    <th>Mobile</th>
                    <th>Name</th>
                    <th>Promo</th>
                    <th>Gift</th>
                    <th>Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const docsUploadedRow = Boolean(u.documents?.uploadedAt);
                    return (
                      <tr key={u._id}>
                        <td>{u.mobile}</td>
                        <td>{u.name || "-"}</td>
                        <td>{u.promoCode || "-"}</td>
                        <td>{u.giftName || "-"}</td>
                        <td>{docsUploadedRow ? "Yes" : "No"}</td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="adminEmptyCell">
                        No users found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {loading ? <p className="dashStatusText">Loading...</p> : null}
          {error ? <div className="adminErrorBlock">{error}</div> : null}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = (props: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className={`dashSidebarItem ${props.active ? "active" : ""}`}
      onClick={props.onClick}
      role={props.onClick ? "button" : undefined}
      tabIndex={props.onClick ? 0 : -1}
    >
      <span className="dashSidebarDot" aria-hidden="true" />
      {props.label}
    </div>
  );
};

const MetricCard = (props: {
  title: string;
  value: string;
  sub: string;
  icon: string;
}) => {
  return (
    <div className="dashMetricCard">
      <div className="dashMetricTop">
        <div>
          <div className="dashMetricTitle">{props.title}</div>
          <div className="dashMetricValue">{props.value}</div>
          <div className="dashMetricSub">{props.sub}</div>
        </div>
        <div className="dashMetricIcon" aria-hidden="true">
          {props.icon}
        </div>
      </div>
    </div>
  );
};

const AudienceChart = () => {
  // Lightweight inline chart (visual only)
  const path = "M0,85 C20,60 40,95 60,70 C80,45 100,65 120,52 C140,40 160,62 180,54 C200,44 220,50 240,40 C260,30 280,42 300,35 C320,28 340,38 360,24 C380,14 400,25 420,18 C440,10 460,20 480,8 L480,120 L0,120 Z";
  return (
    <svg
      className="dashSvg"
      viewBox="0 0 480 120"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="dashGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} fill="url(#dashGrad)" />
      <path
        d="M0,85 C20,60 40,95 60,70 C80,45 100,65 120,52 C140,40 160,62 180,54 C200,44 220,50 240,40 C260,30 280,42 300,35 C320,28 340,38 360,24 C380,14 400,25 420,18 C440,10 460,20 480,8"
        fill="none"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* y-grid */}
      <g opacity="0.25" stroke="#9ca3af">
        <line x1="0" y1="20" x2="480" y2="20" />
        <line x1="0" y1="50" x2="480" y2="50" />
        <line x1="0" y1="80" x2="480" y2="80" />
      </g>
      {/* x labels */}
      <g fontSize="10" fill="#9ca3af">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (t, i) => (
            <text key={t} x={i * 40 + 10} y={112}>
              {t}
            </text>
          )
        )}
      </g>
    </svg>
  );
};

const VisitorsBars = () => {
  const bars = [18, 25, 15, 28, 33, 22, 40];
  return (
    <div className="dashBars">
      <div className="dashBarsGrid">
        {bars.map((v, i) => (
          <div key={i} className="dashBarWrap">
            <div className="dashBar" style={{ height: `${v * 2}%` }} />
          </div>
        ))}
      </div>
      <div className="dashBarsLabels">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
};

const UsersPage = (props: { token: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserDoc[]>([]);

  const [editingId, setEditingId] = useState<string>("");
  const [form, setForm] = useState<Partial<UserDoc>>({});

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<{ users: UserDoc[] }>("/api/admin/users", props.token)
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(err?.message || "Unable to load users"))
      .finally(() => setLoading(false));
  }, [props.token]);

  const startEdit = (u: UserDoc) => {
    setEditingId(u._id);
    setForm({ ...u });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm({});
  };

  const save = async () => {
    if (!editingId) return;
    setLoading(true);
    setError("");
    try {
      const body = {
        name: form.name ?? "",
        email: form.email ?? "",
        address: form.address ?? "",
        city: form.city ?? "",
        state: form.state ?? "",
        pincode: form.pincode ?? "",
        promoCode: form.promoCode ?? "",
        giftName: form.giftName ?? "",
        giftImage: form.giftImage ?? "",
        documents: form.documents ?? undefined,
      };
      await apiFetch(`/api/admin/users/${editingId}`, props.token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await apiFetch<{ users: UserDoc[] }>(
        "/api/admin/users",
        props.token
      );
      setUsers(data.users || []);
      cancelEdit();
    } catch (err: any) {
      setError(err?.message || "Unable to update user");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${id}`, props.token, {
        method: "DELETE",
      });
      const data = await apiFetch<{ users: UserDoc[] }>(
        "/api/admin/users",
        props.token
      );
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err?.message || "Unable to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminLayout">
      <div className="adminCard">
        <div className="adminCardHeader">
          <h2>Users</h2>
        </div>
        {loading ? <p>Loading...</p> : null}
        {error ? <div className="adminErrorBlock">{error}</div> : null}
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Mobile</th>
                <th>Name</th>
                <th>Promo</th>
                <th>Gift</th>
                <th>Docs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const docsUploaded = Boolean(u.documents?.uploadedAt);
                return (
                  <tr key={u._id}>
                    <td>{u.mobile}</td>
                    <td>{u.name || "-"}</td>
                    <td>{u.promoCode || "-"}</td>
                    <td>{u.giftName || "-"}</td>
                    <td>{docsUploaded ? "Yes" : "No"}</td>
                    <td>
                      <button
                        className="adminLinkBtn"
                        type="button"
                        onClick={() => startEdit(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="adminLinkBtn adminDanger"
                        type="button"
                        onClick={() => del(u._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="adminEmptyCell">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editingId ? (
        <div className="adminCard">
          <h2>Edit User</h2>
          <div className="adminFormGrid">
            <label className="adminLabel">
              Name
              <input className="adminInput" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Email
              <input className="adminInput" value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Address
              <input className="adminInput" value={form.address || ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </label>
            <label className="adminLabel">
              City
              <input className="adminInput" value={form.city || ""} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            </label>
            <label className="adminLabel">
              State
              <input className="adminInput" value={form.state || ""} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Pincode
              <input className="adminInput" value={form.pincode || ""} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Promo Code
              <input className="adminInput" value={form.promoCode || ""} onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Gift Name
              <input className="adminInput" value={form.giftName || ""} onChange={(e) => setForm((p) => ({ ...p, giftName: e.target.value }))} />
            </label>
            <label className="adminLabel">
              Gift Image
              <input className="adminInput" value={form.giftImage || ""} onChange={(e) => setForm((p) => ({ ...p, giftImage: e.target.value }))} />
            </label>
          </div>
          <div className="adminActionsRow">
            <button className="adminPrimaryBtn" type="button" onClick={save} disabled={loading}>
              Save
            </button>
            <button className="adminSecondaryBtn" type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const AdminsPage = (props: { token: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState<
    { id: string; email: string; name: string; role: Role }[]
  >([]);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<{ admins: any[] }>("/api/admin/admins", props.token)
      .then((data) => {
        const list = (data.admins || []).map((a: any) => ({
          id: a._id?.toString?.() || a.id,
          email: a.email,
          name: typeof a.name === "string" ? a.name : "",
          role: a.role as Role,
        }));
        setAdmins(list);
      })
      .catch((err) => setError(err?.message || "Unable to load admins"))
      .finally(() => setLoading(false));
  }, [props.token]);

  const reloadAdmins = async () => {
    const data = await apiFetch<{ admins: any[] }>("/api/admin/admins", props.token);
    const list = (data.admins || []).map((a: any) => ({
      id: a._id?.toString?.() || a.id,
      email: a.email,
      name: typeof a.name === "string" ? a.name : "",
      role: a.role as Role,
    }));
    setAdmins(list);
  };

  const addAdmin = async () => {
    if (!newEmail || !newPassword) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/admin/admins", props.token, {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: "ADMIN",
          ...(newName.trim() ? { name: newName.trim() } : {}),
        }),
      });
      await reloadAdmins();
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    } catch (err: any) {
      setError(err?.message || "Unable to create admin");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id: string, nextRole: Role) => {
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/admin/admins/${id}/role`, props.token, {
        method: "PUT",
        body: JSON.stringify({ role: nextRole }),
      });
      await reloadAdmins();
    } catch (err: any) {
      setError(err?.message || "Unable to update role");
    } finally {
      setLoading(false);
    }
  };

  const delAdmin = async (id: string) => {
    if (!confirm("Delete this admin?")) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/admin/admins/${id}`, props.token, { method: "DELETE" });
      await reloadAdmins();
    } catch (err: any) {
      setError(err?.message || "Unable to delete admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminLayout">
      <div className="adminCard">
        <h2>Admins (MASTER)</h2>
        {loading ? <p>Loading...</p> : null}
        {error ? <div className="adminErrorBlock">{error}</div> : null}

        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>
                    <select
                      className="adminInput"
                      value={a.role}
                      disabled={loading}
                      onChange={(e) =>
                        changeRole(a.id, e.target.value as Role)
                      }
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MASTER">MASTER</option>
                    </select>
                  </td>
                  <td>
                    <button className="adminLinkBtn adminDanger" type="button" onClick={() => delAdmin(a.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="adminEmptyCell">
                    No admins found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminCard">
        <h2>Add Admin</h2>
        <div className="adminFormGrid">
          <label className="adminLabel">
            Display name (optional)
            <input
              className="adminInput"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Shown in dashboard greeting"
            />
          </label>
          <label className="adminLabel">
            Email
            <input className="adminInput" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" />
          </label>
          <label className="adminLabel">
            Password
            <input className="adminInput" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
          </label>
        </div>
        <div className="adminActionsRow">
          <button className="adminPrimaryBtn" type="button" onClick={addAdmin} disabled={loading}>
            Add ADMIN user
          </button>
        </div>
        <p className="adminSubtle" style={{ marginTop: 8 }}>
          Role is forced to <b>ADMIN</b> (only the MASTER account has full access).
        </p>
      </div>
    </div>
  );
};

const PromoCodesPage = (props: { token: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<PromoDoc[]>([]);

  const [editingId, setEditingId] = useState<string>("");
  const [form, setForm] = useState<{ code: string; gift: string; image: string; used: boolean }>({
    code: "",
    gift: "",
    image: "",
    used: false,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ promocodes: PromoDoc[] }>("/api/admin/promocodes", props.token);
      setItems(data.promocodes || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load promocodes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [props.token]);

  const startEdit = (p: PromoDoc) => {
    setEditingId(p._id);
    setForm({
      code: p.code || "",
      gift: p.gift || "",
      image: p.image || "",
      used: Boolean(p.used),
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm({ code: "", gift: "", image: "", used: false });
  };

  const submitAddOrUpdate = async () => {
    if (!form.code.trim() || !form.gift.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (editingId) {
        await apiFetch(`/api/admin/promocodes/${editingId}`, props.token, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/api/admin/promocodes", props.token, {
          method: "POST",
          body: JSON.stringify({ code: form.code, gift: form.gift, image: form.image }),
        });
      }
      await load();
      cancelEdit();
    } catch (err: any) {
      setError(err?.message || "Unable to save promocode");
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/admin/promocodes/${id}`, props.token, { method: "DELETE" });
      await load();
      cancelEdit();
    } catch (err: any) {
      setError(err?.message || "Unable to delete promocode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminLayout">
      <div className="adminCard">
        <h2>Promo Codes</h2>
        {loading ? <p>Loading...</p> : null}
        {error ? <div className="adminErrorBlock">{error}</div> : null}
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Code</th>
                <th>Gift</th>
                <th>Image</th>
                <th>Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>{p.code}</td>
                  <td>{p.gift}</td>
                  <td>{p.image ? "Yes" : "No"}</td>
                  <td>{p.used ? "Yes" : "No"}</td>
                  <td>
                    <button className="adminLinkBtn" type="button" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="adminLinkBtn adminDanger" type="button" onClick={() => del(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="adminEmptyCell">
                    No promo codes found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adminCard">
        <h2>{editingId ? "Edit Promo" : "Add Promo"}</h2>
        <div className="adminFormGrid">
          <label className="adminLabel">
            Code
            <input className="adminInput" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          </label>
          <label className="adminLabel">
            Gift
            <input className="adminInput" value={form.gift} onChange={(e) => setForm((p) => ({ ...p, gift: e.target.value }))} />
          </label>
          <label className="adminLabel">
            Image URL
            <input className="adminInput" value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} />
          </label>
          <label className="adminLabel">
            Used
            <select
              className="adminInput"
              value={String(form.used)}
              onChange={(e) => setForm((p) => ({ ...p, used: e.target.value === "true" }))}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </label>
        </div>
        <div className="adminActionsRow">
          <button className="adminPrimaryBtn" type="button" onClick={submitAddOrUpdate} disabled={loading}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId ? (
            <button className="adminSecondaryBtn" type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          ) : null}
        </div>
        <p className="adminSubtle" style={{ marginTop: 8 }}>
          Image can be an absolute URL or a stored path (backend serves `/uploads` and `/images`).
        </p>
      </div>
    </div>
  );
};

export default App;
