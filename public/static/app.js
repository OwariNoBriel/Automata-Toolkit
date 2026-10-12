const $ = (selector) => document.querySelector(selector); // short name for "find the first element matching this selector"

// Sidebar toggle
$("#toggle-sidebar").onclick = () => { // when the ☰ button is clicked
  $("#sidebar").classList.toggle("closed"); // slide the sidebar out of view, or back in
};

// Page navigation
document.querySelectorAll(".sidebar-item").forEach((btn) => { // for every button in the sidebar
  btn.onclick = () => { // when that button is clicked
    document.querySelectorAll(".sidebar-item").forEach((b) => b.classList.remove("active")); // un-highlight all buttons
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active")); // hide all pages
    btn.classList.add("active"); // highlight the clicked button
    const page = $("#page-" + btn.dataset.page); // find the page that belongs to this button
    if (page) page.classList.add("active"); // show that page
  };
});

// Set default active
if ($("#page-tree")) $("#page-tree").classList.add("active"); // start on the Binary Tree page
