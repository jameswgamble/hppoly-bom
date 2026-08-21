const VERSION = "v10.20-restore";
document.title = 'Poly Video Conferencing "Bill" of Materials Generator';
async function init() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `
    <div class="p-4 border border-yellow-500 bg-yellow-50 rounded">
      <h2 class="font-bold text-lg">Temporary restore in progress</h2>
      <p class="mt-2">The full configurator (v10.20 with E60/E70 mount options + PoE+ injector) is being restored. Please refresh in a minute or contact the site owner.</p>
      <p class="text-sm mt-2 text-gray-600">If this persists, the full script.js and skus_merged.json need to be re-uploaded from the working local copies.</p>
    </div>`;
}
init().catch(e => {
  document.getElementById("app").innerHTML = "<p>Error: " + e.message + "</p>";
});
