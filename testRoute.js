// Script to test the clone route
async function run() {
  try {
    // We don't know a valid course ID, so we'll just send a fake one and see what error we get.
    // If it's "Course not found", then the route is working!
    const res = await fetch("http://localhost:3000/api/courses/test_course_id/clone", {
      method: "POST"
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
