const API_BASE = "__API_BASE__";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function statusColor(status) {
  if (status === "DOWN") return "down";
  if (status === "DEGRADED") return "degraded";
  return "operational";
}

async function load() {
  const list = document.getElementById("services");
  list.innerHTML = "Loading...";

  const data = await api("/services");
  const items = data.items || [];

  list.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "service";

    const left = document.createElement("div");
    left.className = "left";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.name;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = item.description || "";

    left.appendChild(title);
    left.appendChild(desc);

    const right = document.createElement("div");
    right.className = "right";

    const select = document.createElement("select");
    for (const s of ["OPERATIONAL", "DEGRADED", "DOWN"]) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      if ((item.status || "OPERATIONAL") === s) opt.selected = true;
      select.appendChild(opt);
    }
    select.className = statusColor(item.status || "OPERATIONAL");
    select.addEventListener("change", async () => {
      const newStatus = select.value;
      await api(`/services/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      await load();
    });

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      await api(`/services/${item.id}`, { method: "DELETE" });
      await load();
    });

    right.appendChild(select);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  }
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  if (!name) return;

  await api("/services", {
    method: "POST",
    body: JSON.stringify({ name, description, status: "OPERATIONAL" })
  });

  document.getElementById("name").value = "";
  document.getElementById("description").value = "";
  await load();
});

load().catch(err => {
  const list = document.getElementById("services");
  list.innerHTML = `Error: ${err.message}`;
});
