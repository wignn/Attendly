import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, Badge } from "@komas/ui";
import { Zap, ShieldCheck, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-16 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl text-center space-y-6">
        <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 border-primary/20 text-primary">
          Enterprise Polyglot Architecture
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Golang <span className="text-primary">+</span> Next.js 15 Monorepo
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          High-performance Clean Architecture backend in Go with PostgreSQL, Redis, and Asynq, seamlessly coupled with Next.js 15 App Router & shadcn/ui.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-16 w-full">
        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Clean Architecture Go</CardTitle>
            <CardDescription>Strictly decoupled domain, service, and repository layers with Chi Router.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-8 w-8 text-primary mb-2" />
            <CardTitle>RBAC & Security</CardTitle>
            <CardDescription>JWT authorization with role-based access control (Admin, Member, User).</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Layers className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Turborepo DX</CardTitle>
            <CardDescription>Instant incremental builds, pnpm workspaces, and shared TypeScript types.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
