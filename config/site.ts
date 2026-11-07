const site = {
  name: "Rasoi & Co.",
  tagline: "A table set for the whole of India.",
  description: "An ever-curious Indian kitchen, travelling from the smoke of the tandoor to the slow warmth of a dum.",
  logo: "R",
  phone: "+91 98765 43210",
  address: "14, Hauz Khas Village, New Delhi, India",
  coordinates: { latitude: 28.5535, longitude: 77.1945 },
  timings: [
    { days: "Monday – Friday", hours: "12:00 pm – 11:00 pm" },
    { days: "Saturday – Sunday", hours: "11:00 am – 11:30 pm" }
  ],
  upi: "rasoiandco@upi",
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/"
  },
  colors: {
    ink: "#191612",
    saffron: "#e6a544",
    cream: "#f4efe5",
    maroon: "#612c27",
    olive: "#69704c"
  }
} as const;

export default site;
