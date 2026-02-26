function changeSummarizationStyle(event) {
  // get the form element
  const form = document.getElementById("summarization-style-form");

  // get the data
  const formData = new FormData(form);

  // get the "filter" field from the form data
  const filter = formData.get("filter");

  // the URL we are currently is of the form:
  // /foo/bar/previous-filter/
  // so we want to replace the "previous-filter" part with the new filter
  const currentPathname = window.location.pathname;
  const newPathname = currentPathname.replace(/\/[^\/]*\/$/, `/${filter}/`);

  // go to it!
  window.location.pathname = newPathname;
}


function doNothing(event) {
  event.preventDefault();
  event.stopPropagation();
}


function showSummarizationStyleForm() {
  // get the form element
  const form = document.getElementById("summarization-style-form");

  // remove the 'hidden' class from the form
  form.classList.remove("hidden");
}


function listenForKeyboardEvents(event) {
  // check to see if the user pressed Option+Shift+S
  if (event.altKey && event.shiftKey && event.code === "KeyS") {
    showSummarizationStyleForm();
  }
}


// ---- Council vote maps --------------------------------------------------------
//
// Initialises a MapLibre GL map inside each .bill-map-canvas element.
// District GeoJSON (seattleio/seattle-boundaries-data) is fetched once and
// reused for every map on the page.
//
// Color key: green = In Favor, red = No/Against/Opposed, gray = Absent/Excused,
//             light gray = district rep not found in data.
//
// At-large member votes are already rendered as HTML badges in the template;
// this code only handles the choropleth map.

var DISTRICT_GEOJSON_URL =
  "https://raw.githubusercontent.com/seattleio/seattle-boundaries-data/master/data/city-council-districts.geojson";

var MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

var VOTE_COLORS = {
  yes:     "#16a34a",
  no:      "#dc2626",
  absent:  "#9ca3af",
  unknown: "#e5e7eb",
};

function voteColor(voteInfo) {
  if (!voteInfo) return VOTE_COLORS.unknown;
  if (voteInfo.in_favor)  return VOTE_COLORS.yes;
  if (voteInfo.opposed)   return VOTE_COLORS.no;
  if (voteInfo.absent)    return VOTE_COLORS.absent;
  return VOTE_COLORS.unknown;
}

function buildDistrictColorExpression(votesByDistrict) {
  // MapLibre "match" expression: ['match', ['get', 'district'], 1, color, 2, color, ..., fallback]
  var expr = ["match", ["get", "district"]];
  for (var d = 1; d <= 7; d++) {
    expr.push(d, voteColor(votesByDistrict[d]));
  }
  expr.push(VOTE_COLORS.unknown); // fallback
  return expr;
}

function initBillMap(canvas, geojson) {
  var votes;
  try {
    votes = JSON.parse(canvas.dataset.votes || "[]");
  } catch (e) {
    return;
  }
  if (!votes.length) return;

  // Index votes by district number
  var votesByDistrict = {};
  votes.forEach(function (v) {
    if (typeof v.district === "number") {
      votesByDistrict[v.district] = v;
    }
  });

  // Compute a tight bounding box for Seattle districts (~47.48,-122.46 to 47.74,-122.22)
  var map = new maplibregl.Map({
    container: canvas,
    style: MAP_STYLE,
    center: [-122.335, 47.608],
    zoom: 9.8,
    interactive: false,
    attributionControl: false,
  });

  map.on("load", function () {
    map.addSource("districts", { type: "geojson", data: geojson });

    map.addLayer({
      id: "district-fills",
      type: "fill",
      source: "districts",
      paint: {
        "fill-color": buildDistrictColorExpression(votesByDistrict),
        "fill-opacity": 0.65,
      },
    });

    map.addLayer({
      id: "district-outlines",
      type: "line",
      source: "districts",
      paint: {
        "line-color": "#ffffff",
        "line-width": 1.5,
      },
    });

    // Small district-number labels
    map.addLayer({
      id: "district-labels",
      type: "symbol",
      source: "districts",
      layout: {
        "text-field": ["get", "district"],
        "text-size": 11,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  });
}

function initAllBillMaps() {
  if (typeof maplibregl === "undefined") return;

  var canvases = document.querySelectorAll(".bill-map-canvas[data-votes]");
  if (!canvases.length) return;

  fetch(DISTRICT_GEOJSON_URL)
    .then(function (r) { return r.json(); })
    .then(function (geojson) {
      canvases.forEach(function (canvas) {
        initBillMap(canvas, geojson);
      });
    })
    .catch(function (err) {
      console.warn("Could not load Seattle district GeoJSON:", err);
    });
}

document.addEventListener("DOMContentLoaded", initAllBillMaps);


// Intro panel chevron: smooth-scroll to the bills section on click.
document.addEventListener("DOMContentLoaded", function () {
  var chevron = document.getElementById("intro-chevron");
  if (chevron) {
    chevron.addEventListener("click", function () {
      var target = document.getElementById("main-content");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
});


// When the document is ready, make sure the summarization style is selected
// correctly, and set up the event handler for when it changes. Use basic
// javascript; no jQuery.
document.addEventListener("DOMContentLoaded", function () {
  // get the current filter from the URL. It will be the final path component
  // of the URL, so split the URL on "/" and get the last element
  const splits = window.location.pathname.split("/");
  let filter = splits[splits.length - 2];

  // make sure it is one of the valid filters, which are:
  // `concise` <-- that's it, for the moment!
  if (!["concise"].includes(filter)) {
    // if it is not one of the valid filters, default to `concise`
    filter = "concise";
  }

  // get the form element
  const form = document.getElementById("summarization-style-form");

  // select the correct option under the "filter" select element
  form.elements["filter"].value = filter;

  // set up the event handler for when the form is submitted
  form.addEventListener("submit", doNothing);

  // set up the event handler for when the form is changed
  form.addEventListener("change", changeSummarizationStyle);

  // set up a listener for keyboard up events
  document.addEventListener("keydown", listenForKeyboardEvents);
});

