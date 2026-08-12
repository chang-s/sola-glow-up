import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Sparkles } from "lucide-react";
import { useAuth } from "./useAuth";

type LocationState = {
	from?: {
		pathname?: string;
	};
};

export function LoginPage() {
	const { isConfigured, signIn, user } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as LocationState | null)?.from?.pathname ?? "/today";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (user) {
		return <Navigate to={from} replace />;
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const result = await signIn(email, password);

		setIsSubmitting(false);

		if (result.error) {
			setError(result.error);
			return;
		}

		navigate(from, { replace: true });
	}

	return (
		<main className="login-page">
			<section className="login-card" aria-labelledby="login-title">
				<div className="pixel-sola large" aria-hidden="true">
					<Sparkles size={34} strokeWidth={2.4} />
				</div>
				<p className="eyebrow">Private daily tracker</p>
				<h1 id="login-title">Sola Glow-Up</h1>
				<p>Sign in to your tiny cozy check-in space.</p>

				{isConfigured ? (
					<form className="login-form" onSubmit={handleSubmit}>
						<label>
							<span>Email</span>
							<input
								type="email"
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</label>
						<label>
							<span>Password</span>
							<input
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
							/>
						</label>
						{error ? <p className="form-error">{error}</p> : null}
						<button type="submit" disabled={isSubmitting}>
							<LockKeyhole aria-hidden="true" size={18} />
							{isSubmitting ? "Signing in..." : "Sign in"}
						</button>
					</form>
				) : (
					<div className="setup-panel" role="status">
						<strong>Supabase setup pending</strong>
						<span>
							Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a local
							`.env.local` file to enable real authentication.
						</span>
					</div>
				)}
			</section>
		</main>
	);
}
