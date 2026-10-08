"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function RegisterPage() {

  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function register(e) {

    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Registration successful. Please check your email if confirmation is required."
    );

    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        <div className="text-center mb-8">

          <div className="text-5xl">
            🌱
          </div>

          <h1 className="text-3xl font-bold text-green-700 mt-3">
            Create Account
          </h1>

          <p className="text-gray-500 mt-2">
            Start managing your organic farm
          </p>

        </div>

        <form
          onSubmit={register}
          className="space-y-5"
        >

          <div>

            <label className="block mb-2 font-medium">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />

          </div>

          <div>

            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />

          </div>

          <div>

            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

        </form>

        {message && (
          <p className="text-center text-sm text-green-700 mt-5">
            {message}
          </p>
        )}

        <p className="text-center text-sm mt-6">

          Already have an account?{" "}

          <button
            onClick={() => router.push("/login")}
            className="text-green-600 font-semibold"
          >
            Login
          </button>

        </p>

      </div>

    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function LoginPage() {

  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e) {

    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        <div className="text-center mb-8">

          <div className="text-5xl">
            🌱
          </div>

          <h1 className="text-3xl font-bold text-green-700 mt-3">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your farm
          </p>

        </div>

        <form
          onSubmit={login}
          className="space-y-5"
        >

          <div>

            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          <div>

            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center text-sm mt-6">

          Don't have an account?{" "}

          <button
            onClick={() => router.push("/register")}
            className="text-green-600 font-semibold"
          >
            Register
          </button>

        </p>

      </div>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function Dashboard() {

  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("Farmer");

  const [farms, setFarms] = useState(0);
  const [fields, setFields] = useState(0);
  const [crops, setCrops] = useState(0);
  const [tasks, setTasks] = useState(0);

  useEffect(() => {

    async function loadDashboard() {

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setName(
        user.user_metadata?.full_name || "Farmer"
      );

      const farmsResult =
        await supabase
          .from("farms")
          .select("id", { count: "exact" });

      const fieldsResult =
        await supabase
          .from("fields")
          .select("id", { count: "exact" });

      const cropsResult =
        await supabase
          .from("crops")
          .select("id", { count: "exact" });

      const tasksResult =
        await supabase
          .from("tasks")
          .select("id", { count: "exact" })
          .eq("status", "Pending");

      setFarms(farmsResult.count || 0);
      setFields(fieldsResult.count || 0);
      setCrops(cropsResult.count || 0);
      setTasks(tasksResult.count || 0);
    }

    loadDashboard();

  }, []);

  async function logout() {

    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">

          <h1 className="text-2xl font-bold text-green-700">
            🌱 OrganicFarm
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>

      </nav>

      <div className="max-w-7xl mx-auto p-6">

        <h2 className="text-3xl font-bold">
          Welcome, {name} 👋
        </h2>

        <p className="text-gray-500 mt-2">
          Here's your farm overview.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          <Card
            title="Farms"
            value={farms}
            icon="🏡"
          />

          <Card
            title="Fields"
            value={fields}
            icon="🌾"
          />

          <Card
            title="Crops"
            value={crops}
            icon="🌱"
          />

          <Card
            title="Pending Tasks"
            value={tasks}
            icon="📋"
          />

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <MenuCard
            title="Farm Management"
            description="Manage farms and fields"
            button="Open Farms"
            onClick={() => router.push("/farms")}
          />

          <MenuCard
            title="Crop Management"
            description="Manage your organic crops"
            button="Open Crops"
            onClick={() => router.push("/crops")}
          />

          <MenuCard
            title="Tasks"
            description="Manage daily farm tasks"
            button="Open Tasks"
            onClick={() => router.push("/tasks")}
          />

          <MenuCard
            title="Expenses"
            description="Track farm expenses"
            button="Open Expenses"
            onClick={() => router.push("/expenses")}
          />

        </div>

      </div>

    </main>
  );
}

function Card({ title, value, icon }) {

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <div className="text-3xl">
        {icon}
      </div>

      <p className="text-gray-500 mt-4">
        {title}
      </p>

      <h3 className="text-3xl font-bold mt-2">
        {value}
      </h3>

    </div>
  );
}

function MenuCard({
  title,
  description,
  button,
  onClick
}) {

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <p className="text-gray-500 mt-2">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-5 bg-green-600 text-white px-5 py-2 rounded-lg"
      >
        {button}
      </button>

    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function FarmsPage() {

  const router = useRouter();
  const supabase = createClient();

  const [farms, setFarms] = useState([]);

  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  async function loadFarms() {

    const { data } = await supabase
      .from("farms")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    setFarms(data || []);
  }

  useEffect(() => {

    async function checkUser() {

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      loadFarms();
    }

    checkUser();

  }, []);

  async function addFarm(e) {

    e.preventDefault();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("farms")
      .insert({
        user_id: user.id,
        farm_name: farmName,
        location: location,
        total_area: Number(area)
      });

    if (error) {

      alert(error.message);
      return;

    }

    setFarmName("");
    setLocation("");
    setArea("");

    loadFarms();
  }

  async function deleteFarm(id) {

    const confirmDelete =
      confirm("Delete this farm?");

    if (!confirmDelete) return;

    await supabase
      .from("farms")
      .delete()
      .eq("id", id);

    loadFarms();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-6xl mx-auto">

        <button
          onClick={() => router.push("/dashboard")}
          className="text-green-700 mb-5"
        >
          ← Dashboard
        </button>

        <h1 className="text-3xl font-bold">
          🏡 My Farms
        </h1>

        <form
          onSubmit={addFarm}
          className="bg-white rounded-xl shadow p-6 mt-6"
        >

          <h2 className="text-xl font-bold mb-5">
            Add Farm
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <input
              placeholder="Farm name"
              value={farmName}
              onChange={(e) =>
                setFarmName(e.target.value)
              }
              required
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Location"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              className="border rounded-lg p-3"
            />

            <input
              type="number"
              placeholder="Area (acre)"
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              className="border rounded-lg p-3"
            />

          </div>

          <button
            className="mt-5 bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            Add Farm
          </button>

        </form>

        <div className="grid md:grid-cols-2 gap-5 mt-8">

          {farms.map((farm) => (

            <div
              key={farm.id}
              className="bg-white rounded-xl shadow p-6"
            >

              <h2 className="text-xl font-bold">
                🌱 {farm.farm_name}
              </h2>

              <p className="text-gray-500 mt-2">
                📍 {farm.location || "Location not added"}
              </p>

              <p className="text-gray-500">
                📐 {farm.total_area || 0} acre
              </p>

              <button
                onClick={() =>
                  deleteFarm(farm.id)
                }
                className="mt-4 text-red-600"
              >
                Delete
              </button>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}