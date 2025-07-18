
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await login(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "There was an issue logging in. Please try again."
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in."
        });
        
        // Navigate immediately - the auth state will handle protection
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "There was an issue logging in. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, navigate]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match."
      });
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await signup(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message || "There was an issue creating your account. Please try again."
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account."
        });
        // Clear form after successful signup
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "There was an issue creating your account. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, confirmPassword, signup]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-cigass-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="/cigass-logo.png" 
              alt="CIGASS" 
              className="h-16 w-auto"
            />
          </div>
          <CardDescription className="text-center">Advanced Research Platform</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input 
                    id="signup-confirm-password" 
                    type="password" 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
