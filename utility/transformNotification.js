function transformNotification(notif) {
  const sender = notif.sender;
  const name = sender?.name || "Someone";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Generate a consistent color based on sender's id (or name)
  const color = getColorFromId(sender?._id || notif.sender);

  // Format relative time (e.g., "2m", "1h", "yesterday")
  const time = formatRelativeTime(notif.createdAt);

  // Build message and detail based on notification type
  let message = "";
  let detail = "";
  let preview = "";
  let cat = "";

  switch (notif.type) {
    case "follow_request":
      cat = "follows";
      message = "sent you a follow request";
      detail = `${name} wants to follow you. You can accept or decline.`;
      // optionally include follower count if you have it
      break;
    case "follow_accepted":
      cat = "follows";
      message = "accepted your follow request";
      detail = `${name} is now following you back.`;
      break;
    // add other cases later
    default:
      cat = notif.type;
      message = `sent you a ${notif.type}`;
      detail = `You have a new ${notif.type} notification.`;
  }

  return {
    id: notif._id,
    cat, // category for tab filtering (e.g., "follows")
    read: notif.read,
    time,
    name,
    initials,
    color,
    message,
    type: notif.type, // used to decide whether to show Accept/Decline buttons
    detail, // full detail for the right panel
    preview, // optional – for posts, comments, etc.
    // You can also pass raw data if needed (e.g., followRequest ref)
  };
}

// Helper: generate a deterministic color from an ID
function getColorFromId(id) {
  const colors = ["purple", "teal", "coral", "blue", "amber", "pink"];
  const hash = id
    .toString()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Helper: format relative time (you can use a library like `dayjs` or implement manually)
function formatRelativeTime(date) {
  // Simple example – you can improve this
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d`;
}


module.exports = { transformNotification };