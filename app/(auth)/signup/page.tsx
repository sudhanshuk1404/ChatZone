"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // or your preferred toast library

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: "https://chat-zone-kappa.vercel.app/login",
        },
      });

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Signup succeeded but no user returned.");

      // Insert into public.users table
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          name,
          avatar_url: `https://api.dicebear.com/6.x/initials/svg?seed=${
            name || user.email
          }`,
          is_online: true,
        },
        { onConflict: "id" }
      );

      if (upsertError) throw upsertError;

      toast.success("Signup successful!", {
        description: "Please check your email to confirm your account.",
      });

      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error("Signup failed", {
        description: err.message || "An error occurred during signup",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-6 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-center">Create Account</h2>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={errors.name ? "border-red-500" : ""}
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "border-red-500" : ""}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <Button onClick={handleSignup} disabled={loading} className="mt-2">
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-sm text-center text-gray-600 mt-4">
        Already have an account?{" "}
        <a
          href="/login"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
