// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/fordypningsprosjekt.php",
        destination: "https://www.idi.ntnu.no/education/fordypningsprosjekt.php",
      },
    ]
  },
}

