-- Enhanced features migration
-- This migration adds all the new tables and features requested

-- Company Info table for CMS
CREATE TABLE IF NOT EXISTS company_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL CHECK (section IN ('about', 'mission', 'vision', 'values')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Detail table for dynamic service pages
CREATE TABLE IF NOT EXISTS services_detail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    detailed_description TEXT,
    features TEXT[] DEFAULT '{}',
    pricing_info TEXT,
    image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members table for CMS
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    social_links JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Items table for CMS
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    client_name TEXT,
    project_date DATE,
    image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates table for admin
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quote_sent', 'info_request', 'follow_up', 'completed')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance existing tables with new fields

-- Add new fields to rfq_submissions
ALTER TABLE rfq_submissions 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS quote_file_url TEXT,
ADD COLUMN IF NOT EXISTS communication_log JSONB DEFAULT '[]';

-- Add new fields to profiles for address management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_addresses JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS shipping_addresses JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add new fields to notifications for enhanced functionality
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_text TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_info_language_section ON company_info(language, section);
CREATE INDEX IF NOT EXISTS idx_company_info_active_order ON company_info(is_active, order_index);

CREATE INDEX IF NOT EXISTS idx_services_detail_language_active ON services_detail(language, is_active);
CREATE INDEX IF NOT EXISTS idx_services_detail_slug ON services_detail(slug);
CREATE INDEX IF NOT EXISTS idx_services_detail_category ON services_detail(category);
CREATE INDEX IF NOT EXISTS idx_services_detail_featured ON services_detail(is_featured);

CREATE INDEX IF NOT EXISTS idx_team_members_language_active ON team_members(language, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(order_index);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_language_active ON portfolio_items(language, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured ON portfolio_items(is_featured);

CREATE INDEX IF NOT EXISTS idx_rfq_submissions_assigned_to ON rfq_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rfq_submissions_status_created ON rfq_submissions(status, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, type) VALUES
('Quote Sent', 'Your Quote is Ready - {{project_name}}', 
'<h2>Hello {{customer_name}},</h2>
<p>Thank you for your interest in our printing services. We have prepared a quote for your project "{{project_name}}".</p>
<p>Please review the attached quote and let us know if you have any questions.</p>
<p>Best regards,<br>PT. EMRAN GHANIM ASAHI Team</p>', 'quote_sent'),

('Information Request', 'Additional Information Required - {{project_name}}', 
'<h2>Hello {{customer_name}},</h2>
<p>Thank you for submitting your RFQ for "{{project_name}}".</p>
<p>To provide you with the most accurate quote, we need some additional information. Please reply to this email with the requested details.</p>
<p>Best regards,<br>PT. EMRAN GHANIM ASAHI Team</p>', 'info_request'),

('Follow Up', 'Following up on your quote - {{project_name}}', 
'<h2>Hello {{customer_name}},</h2>
<p>We wanted to follow up on the quote we sent for your project "{{project_name}}".</p>
<p>If you have any questions or would like to proceed, please don''t hesitate to contact us.</p>
<p>Best regards,<br>PT. EMRAN GHANIM ASAHI Team</p>', 'follow_up'),

('Project Completed', 'Your project is completed - {{project_name}}', 
'<h2>Hello {{customer_name}},</h2>
<p>Great news! Your project "{{project_name}}" has been completed successfully.</p>
<p>Thank you for choosing PT. EMRAN GHANIM ASAHI for your printing needs.</p>
<p>Best regards,<br>PT. EMRAN GHANIM ASAHI Team</p>', 'completed')
ON CONFLICT DO NOTHING;

-- Insert sample company info
INSERT INTO company_info (section, title, content, order_index, language) VALUES
('about', 'About PT. EMRAN GHANIM ASAHI', 'PT. EMRAN GHANIM ASAHI adalah perusahaan percetakan dan labeling terkemuka yang berkomitmen memberikan solusi cetak berkualitas tinggi untuk berbagai kebutuhan bisnis.', 1, 'id'),
('about', 'About PT. EMRAN GHANIM ASAHI', 'PT. EMRAN GHANIM ASAHI is a leading printing and labeling company committed to providing high-quality printing solutions for various business needs.', 1, 'en'),
('mission', 'Misi Kami', 'Memberikan layanan percetakan dan labeling terbaik dengan teknologi modern dan tim profesional yang berpengalaman.', 2, 'id'),
('mission', 'Our Mission', 'To provide the best printing and labeling services with modern technology and experienced professional team.', 2, 'en'),
('vision', 'Visi Kami', 'Menjadi perusahaan percetakan terdepan di Indonesia yang dikenal karena kualitas, inovasi, dan pelayanan prima.', 3, 'id'),
('vision', 'Our Vision', 'To become the leading printing company in Indonesia known for quality, innovation, and excellent service.', 3, 'en')
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services_detail (name, slug, description, detailed_description, features, category, is_featured, order_index, language) VALUES
('Business Cards', 'business-cards', 'Professional business cards for your company', 'High-quality business cards printed on premium paper with various finishing options including matte, glossy, and spot UV.', '{"Premium paper quality", "Multiple finishing options", "Fast turnaround", "Custom designs"}', 'Corporate', true, 1, 'en'),
('Kartu Nama', 'kartu-nama', 'Kartu nama profesional untuk perusahaan Anda', 'Kartu nama berkualitas tinggi dicetak pada kertas premium dengan berbagai pilihan finishing termasuk matte, glossy, dan spot UV.', '{"Kualitas kertas premium", "Berbagai pilihan finishing", "Pengerjaan cepat", "Desain custom"}', 'Corporate', true, 1, 'id'),
('Brochures', 'brochures', 'Eye-catching brochures for marketing', 'Professional brochures designed to showcase your products and services effectively with high-quality printing and paper options.', '{"Professional design", "High-quality printing", "Various paper options", "Custom sizes"}', 'Marketing', true, 2, 'en'),
('Brosur', 'brosur', 'Brosur menarik untuk pemasaran', 'Brosur profesional yang dirancang untuk menampilkan produk dan layanan Anda secara efektif dengan pilihan cetak dan kertas berkualitas tinggi.', '{"Desain profesional", "Cetak berkualitas tinggi", "Berbagai pilihan kertas", "Ukuran custom"}', 'Marketing', true, 2, 'id')
ON CONFLICT DO NOTHING;

-- Insert sample team members
INSERT INTO team_members (name, position, bio, order_index, language) VALUES
('Emran Ghanim', 'CEO & Founder', 'Experienced leader in the printing industry with over 15 years of expertise in delivering high-quality printing solutions.', 1, 'en'),
('Emran Ghanim', 'CEO & Founder', 'Pemimpin berpengalaman di industri percetakan dengan lebih dari 15 tahun keahlian dalam memberikan solusi cetak berkualitas tinggi.', 1, 'id'),
('Sarah Johnson', 'Production Manager', 'Oversees all production processes ensuring quality and timely delivery of all printing projects.', 2, 'en'),
('Sarah Johnson', 'Manajer Produksi', 'Mengawasi semua proses produksi memastikan kualitas dan pengiriman tepat waktu untuk semua proyek cetak.', 2, 'id')
ON CONFLICT DO NOTHING;

-- Insert sample portfolio items
INSERT INTO portfolio_items (title, description, category, client_name, is_featured, order_index, language) VALUES
('Corporate Branding Package', 'Complete branding solution including business cards, letterheads, and brochures', 'Corporate', 'ABC Corporation', true, 1, 'en'),
('Paket Branding Korporat', 'Solusi branding lengkap termasuk kartu nama, kop surat, dan brosur', 'Corporate', 'ABC Corporation', true, 1, 'id'),
('Product Catalog Design', 'Professional product catalog with high-quality photography and layout', 'Marketing', 'XYZ Company', true, 2, 'en'),
('Desain Katalog Produk', 'Katalog produk profesional dengan fotografi dan layout berkualitas tinggi', 'Marketing', 'XYZ Company', true, 2, 'id')
ON CONFLICT DO NOTHING;

-- Create RLS policies for new tables
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access for company_info" ON company_info FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for services_detail" ON services_detail FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for team_members" ON team_members FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for portfolio_items" ON portfolio_items FOR SELECT USING (is_active = true);

-- Admin full access for content management
CREATE POLICY "Admin full access for company_info" ON company_info FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin full access for services_detail" ON services_detail FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin full access for team_members" ON team_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin full access for portfolio_items" ON portfolio_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin full access for email_templates" ON email_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON company_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_detail_updated_at BEFORE UPDATE ON services_detail FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate user risk score
CREATE OR REPLACE FUNCTION calculate_user_risk_score(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    activity_count INTEGER;
    goal_completion_rate DECIMAL;
    days_since_last_activity INTEGER;
    risk_score DECIMAL;
BEGIN
    -- Count activities in last 30 days
    SELECT COUNT(*) INTO activity_count
    FROM user_activities 
    WHERE user_activities.user_id = calculate_user_risk_score.user_id
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate goal completion rate
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)
        END INTO goal_completion_rate
    FROM user_goals 
    WHERE user_goals.user_id = calculate_user_risk_score.user_id;
    
    -- Days since last activity
    SELECT 
        COALESCE(
            EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER,
            30
        ) INTO days_since_last_activity
    FROM user_activities 
    WHERE user_activities.user_id = calculate_user_risk_score.user_id;
    
    -- Calculate risk score (0-10, higher is riskier)
    risk_score := 
        CASE 
            WHEN activity_count = 0 THEN 10
            WHEN activity_count < 5 THEN 8
            WHEN activity_count < 10 THEN 6
            WHEN activity_count < 20 THEN 4
            ELSE 2
        END +
        CASE 
            WHEN goal_completion_rate = 0 THEN 2
            WHEN goal_completion_rate < 0.3 THEN 1
            ELSE 0
        END +
        CASE 
            WHEN days_since_last_activity > 14 THEN 2
            WHEN days_since_last_activity > 7 THEN 1
            ELSE 0
        END;
    
    RETURN LEAST(risk_score, 10);
END;
$$ LANGUAGE plpgsql;

-- Create function to update user risk scores
CREATE OR REPLACE FUNCTION update_user_risk_scores()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    new_risk_score DECIMAL;
BEGIN
    FOR user_record IN SELECT id, risk_score_current FROM profiles LOOP
        new_risk_score := calculate_user_risk_score(user_record.id);
        
        UPDATE profiles 
        SET 
            risk_score_previous = risk_score_current,
            risk_score_current = new_risk_score,
            updated_at = NOW()
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate proactive notifications
CREATE OR REPLACE FUNCTION generate_proactive_notifications()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    goal_record RECORD;
    rfq_record RECORD;
BEGIN
    -- Goal deadline reminders
    FOR goal_record IN 
        SELECT g.*, p.id as user_id 
        FROM user_goals g
        JOIN profiles p ON g.user_id = p.id
        WHERE g.status = 'in_progress'
        AND g.target_date IS NOT NULL
        AND g.target_date <= CURRENT_DATE + INTERVAL '3 days'
        AND g.target_date > CURRENT_DATE
    LOOP
        INSERT INTO notifications (user_id, title, message, type, metadata)
        VALUES (
            goal_record.user_id,
            'Goal Deadline Reminder',
            'Your goal "' || goal_record.title || '" is due in ' || 
            (goal_record.target_date - CURRENT_DATE) || ' days.',
            'goal_reminder',
            jsonb_build_object('goal_id', goal_record.id, 'days_remaining', goal_record.target_date - CURRENT_DATE)
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- RFQ follow-up notifications
    FOR rfq_record IN 
        SELECT r.*, p.id as user_id
        FROM rfq_submissions r
        JOIN profiles p ON r.user_email = p.email
        WHERE r.status = 'pending'
        AND r.created_at <= NOW() - INTERVAL '3 days'
    LOOP
        INSERT INTO notifications (user_id, title, message, type, metadata, action_text, action_url)
        VALUES (
            rfq_record.user_id,
            'RFQ Follow-up',
            'Your RFQ "' || rfq_record.project_name || '" has been pending for 3 days. Use our chatbot for updates.',
            'proactive_suggestion',
            jsonb_build_object('rfq_id', rfq_record.id),
            'Open Chatbot',
            '#chatbot'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for analytics dashboard
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT 
    DATE(timestamp) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_count DESC;

-- Grant necessary permissions
GRANT SELECT ON analytics_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_risk_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_risk_scores() TO service_role;
GRANT EXECUTE ON FUNCTION generate_proactive_notifications() TO service_role;

-- Create a scheduled job to update risk scores daily (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('update-risk-scores', '0 2 * * *', 'SELECT update_user_risk_scores();');
-- SELECT cron.schedule('generate-notifications', '0 9 * * *', 'SELECT generate_proactive_notifications();');

COMMENT ON TABLE company_info IS 'Stores dynamic company information for CMS';
COMMENT ON TABLE services_detail IS 'Stores detailed service information for dynamic service pages';
COMMENT ON TABLE team_members IS 'Stores team member information for CMS';
COMMENT ON TABLE portfolio_items IS 'Stores portfolio items for CMS';
COMMENT ON TABLE email_templates IS 'Stores email templates for automated communications';
COMMENT ON FUNCTION calculate_user_risk_score(UUID) IS 'Calculates user engagement risk score based on activity patterns';
COMMENT ON FUNCTION update_user_risk_scores() IS 'Updates risk scores for all users';
COMMENT ON FUNCTION generate_proactive_notifications() IS 'Generates proactive notifications for users';
