const $ = s => document.querySelector(s);

// Sidebar toggle
$("#toggle-sidebar").onclick = () => {
  $("#sidebar").classList.toggle("closed");
};

// Page navigation
document.querySelectorAll(".sidebar-item").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".sidebar-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const page = $("#page-" + btn.dataset.page);
    if (page) page.classList.add("active");
  };
});

// Set default active
if ($("#page-tree")) $("#page-tree").classList.add("active");
