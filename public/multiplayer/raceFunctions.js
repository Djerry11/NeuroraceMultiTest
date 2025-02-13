function displayBackToLobbyButton() {
  // Create a container for proper positioning
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    top: "60%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
    textAlign: "center",
  });

  // Create the button element
  const lobbyButton = document.createElement("button");
  lobbyButton.innerText = "Back to Lobby";
  Object.assign(lobbyButton.style, {
    fontSize: "3rem", // Big font size similar to your countdown
    padding: "20px 40px",
    backgroundColor: "blue", // You can adjust this color as needed
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "50px",
  });

  // Add an event listener to handle redirection back to the lobby
  lobbyButton.addEventListener("click", () => {
    // Redirect to your lobby page.
    window.location.href = "../multiplayer/lobby.html";
  });

  // Append the button to the container and container to the document body
  container.appendChild(lobbyButton);
  document.body.appendChild(container);
}
