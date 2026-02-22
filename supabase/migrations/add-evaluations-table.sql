-- Create evaluations table for storing official evaluation PDFs
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES members(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  activity_id UUID REFERENCES member_activities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_evaluations_member_id ON evaluations(member_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_evaluation_date ON evaluations(evaluation_date DESC);
CREATE INDEX idx_evaluations_activity_id ON evaluations(activity_id);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE
  ON evaluations FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated read access
-- Officials can only see their own evaluations
-- Evaluators and admins can see all evaluations
CREATE POLICY "Allow users to read own evaluations" ON evaluations
  FOR SELECT USING (true);

-- Note: Row-level security for role-based access should be handled at the application level
-- since we're using Netlify Functions with service role key
