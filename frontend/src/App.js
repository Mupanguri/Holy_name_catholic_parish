import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CMSProvider } from './context/CMSContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeProvider';
import { initializeTracking } from './services/logger';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/About';
import Events from './Events/Events';
import MainGov from './pages/MainGov';
import FamilyApo from './pages/FamilyApo';
import ContactPage from './pages/ContactPage';
import EventCalendar from './components/EventCalender';
import SpecialEvents from './pages/SpecialEvents';
import Footer from './components/Footer';
import Chemwoyo from './pages/cMwoyo';
import ChaMariya from './pages/chaMariya';
import AgnesAloisGuild from './pages/agnesandalois';
import MoyoMusandeGuild from './pages/Musande';
import SoccomPage from './pages/soccomm';
import CatechesisPage from './pages/catechisis';
import CCRPage from './pages/CCRPage';
import EnglishChoir from './pages/Choir';
import ParachuteRegiment from './sections/parachuteregime';
import AvondaleWestSection from './sections/avondalew';
import BloomingdaleSection from './sections/bloomingdale';
import MeyrickParkSection from './sections/meyrick';
import CotswoldHillsSection from './sections/costwold';
import MabelreignCentralSection from './sections/Malbereign';
import HaigParkSection from './sections/haig';
import ChoirShona from './pages/choirshona';
import VaticanPage from './Events/Vatican';
import GalleryPage from './Gallery/GalleryPage';
import InternationalOutreach from './pages/InternationalOutreach';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import YouthCouncil from './pages/YouthCouncil';
import AltarServers from './pages/AltarServers';
import MissionaryChildhood from './pages/MissionaryChildhood';
import StAnne from './pages/StAnne';
import StJoachim from './pages/StJoachim';
import StJoseph from './pages/StJoseph';
import StPeterAndMary from './pages/StPeterAndMary';
import StMaryYouth from './pages/StMaryYouth';
import CYA from './pages/CYA';
import Programs from './pages/Programs';
import Library from './pages/Library';
import DynamicPage from './components/DynamicPage';
import CommunitiesPage from './pages/CommunitiesPage';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import DashboardHome from './pages/admin/DashboardHome';
import PagesManager from './pages/admin/PagesManager';
import PageEditor from './pages/admin/PageEditor';
import PageEditorWYSIWYG from './pages/admin/PageEditorWYSIWYG';
import PostsManager from './pages/admin/PostsManager';
import PostEditor from './pages/admin/PostEditor';
import MediaLibrary from './pages/admin/MediaLibrary';
import SubmissionsReview from './pages/admin/SubmissionsReview';
import TasksManager from './pages/admin/TasksManager';
import AdminNotifications from './pages/admin/AdminNotifications';
import UsersManager from './pages/admin/UsersManager';
import { PageWrapper } from './components/PageWrapper';
import GlobalTheme from './components/GlobalTheme';
import ComingSoon from './components/ComingSoon';

// Layout component for public pages (with Header/Footer)
const PublicLayout = ({ children }) => {
  const location = useLocation();
  return (
    <>
      <GlobalTheme />
      <Header />
      <div key={location.pathname} className="hn-page-enter">
        {children}
      </div>
      <Footer />
      <EventCalendar />
    </>
  );
};

// Wrapper component: passes full URL path to DynamicPage for nested slug lookup
const DynamicPageWrapper = () => {
  const location = useLocation();
  // Strip leading slash → "communities/youth-guilds/agnes-alois/day-of-prayer"
  const path = location.pathname.replace(/^\//, '');
  return <DynamicPage path={path} />;
};

function App() {
  // Initialize frontend logging on app start
  React.useEffect(() => {
    initializeTracking();
  }, []);

  return (
    <ThemeProvider>
      <Toaster richColors position="top-right" />
      <AuthProvider>
        <CMSProvider>
          <Router>
            <Routes>
              {/* ===================== ADMIN ROUTES ===================== */}

              {/* Public Admin Login - No Navbar/Footer */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Dashboard - No Navbar/Footer */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="pages" element={<PagesManager />} />
                <Route path="pages/new" element={<PageEditor />} />
                <Route path="pages/edit/:id" element={<PageEditor />} />
                <Route path="pages/wysiwyg/new" element={<PageEditorWYSIWYG />} />
                <Route path="pages/wysiwyg/:id" element={<PageEditorWYSIWYG />} />
                <Route path="posts" element={<PostsManager />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/edit/:id" element={<PostEditor />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="submissions" element={<SubmissionsReview />} />
                <Route path="tasks" element={<TasksManager />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="users" element={<UsersManager />} />
                {/* Default admin route */}
                <Route index element={<DashboardHome />} />
              </Route>

              {/* ===================== PUBLIC WEBSITE ROUTES ===================== */}

              <Route
                path="/"
                element={
                  <PublicLayout>
                    <Home />
                  </PublicLayout>
                }
              />

              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="about">
                      <About />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/events"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="events">
                      <Events />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/contact"
                element={
                  <PublicLayout>
                    <ContactPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/posts"
                element={
                  <PublicLayout>
                    <PostsPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/posts/:id"
                element={
                  <PublicLayout>
                    <PostDetailPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/library"
                element={
                  <PublicLayout>
                    <Library />
                  </PublicLayout>
                }
              />

              <Route
                path="/programs"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="programs">
                      <Programs />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== COMMUNITIES ROUTES ===================== */}

              {/* Main Communities Page with Oak Tree */}
              <Route
                path="/communities"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities">
                      <CommunitiesPage />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== SECTIONS (Geographic Areas) ===================== */}
              <Route
                path="/communities/sections/parachute-regiment"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/parachute-regiment">
                      <ParachuteRegiment />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/avondale-west"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/avondale-west">
                      <AvondaleWestSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/bloomingdale"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/bloomingdale">
                      <BloomingdaleSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/meyrick-park"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/meyrick-park">
                      <MeyrickParkSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/cotswold-hills"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/cotswold-hills">
                      <CotswoldHillsSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/mabelreign-central"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/mabelreign-central">
                      <MabelreignCentralSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/sections/haig-park"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/sections/haig-park">
                      <HaigParkSection />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== CHOIR ===================== */}
              <Route
                path="/communities/choir/english"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/choir/english">
                      <EnglishChoir />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/choir/shona"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/choir/shona">
                      <ChoirShona />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== COMMITTEES ===================== */}
              <Route
                path="/communities/committees/main-gov"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/committees/main-gov">
                      <MainGov />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* Committees - now handled by dynamic route */}
              {/*
              <Route
                path="/communities/committees/youth-council"
                element={
                  <PublicLayout>
                    <YouthCouncil />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/committees/altar-servers"
                element={
                  <PublicLayout>
                    <AltarServers />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/committees/missionary-childhood"
                element={
                  <PublicLayout>
                    <MissionaryChildhood />
                  </PublicLayout>
                }
              />
              */}

              <Route
                path="/communities/committees/family-apostolate"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/committees/family-apostolate">
                      <FamilyApo />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== SUPPORT TEAMS ===================== */}
              <Route
                path="/communities/support-teams/soccom"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/support-teams/soccom">
                      <SoccomPage />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/support-teams/catechesis"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/support-teams/catechesis">
                      <CatechesisPage />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/support-teams/ccr"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/support-teams/ccr">
                      <CCRPage />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/events/special-events"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="events/special-events">
                      <SpecialEvents />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== ADULT GUILDS ===================== */}
              <Route
                path="/communities/adult-guilds/chemwoyo"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/adult-guilds/chemwoyo">
                      <Chemwoyo />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* Adult Guilds - now handled by dynamic route */}
              {/*
              <Route
                path="/communities/adult-guilds/st-anne"
                element={
                  <PublicLayout>
                    <StAnne />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/adult-guilds/st-joachim"
                element={
                  <PublicLayout>
                    <StJoachim />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/adult-guilds/st-joseph"
                element={
                  <PublicLayout>
                    <StJoseph />
                  </PublicLayout>
                }
              />
              */}

              <Route
                path="/communities/adult-guilds/chamariya"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/adult-guilds/chamariya">
                      <ChaMariya />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== YOUTH GUILDS ===================== */}
              <Route
                path="/communities/youth-guilds/musande"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/youth-guilds/musande">
                      <MoyoMusandeGuild />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/youth-guilds/agnes-alois"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="communities/youth-guilds/agnes-alois">
                      <AgnesAloisGuild />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* Youth Guilds - now handled by dynamic route */}
              {/*
              <Route
                path="/communities/youth-guilds/st-peter-mary"
                element={
                  <PublicLayout>
                    <StPeterAndMary />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/youth-guilds/st-mary-youth"
                element={
                  <PublicLayout>
                    <StMaryYouth />
                  </PublicLayout>
                }
              />

              <Route
                path="/communities/youth-guilds/cya"
                element={
                  <PublicLayout>
                    <CYA />
                  </PublicLayout>
                }
              />
              */}

              {/* ===================== EVENT PAGES ===================== */}
              <Route
                path="/international-outreach"
                element={
                  <PublicLayout>
                    <PageWrapper pageSlug="international-outreach">
                      <InternationalOutreach />
                    </PageWrapper>
                  </PublicLayout>
                }
              />

              {/* ===================== CATCH-ALL DYNAMIC PAGE ROUTE ===================== */}
              {/* 3-level: /communities/youth-guilds/agnes-alois */}
              <Route
                path="/communities/:category/:slug"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />
              {/* 4-level: /communities/youth-guilds/agnes-alois/day-of-prayer */}
              <Route
                path="/communities/:category/:guild/:leaf"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />
              {/* 5-level: /communities/youth-guilds/agnes-alois/sub-guild/leaf */}
              <Route
                path="/communities/:category/:guild/:subguild/:leaf"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />

              {/* ===================== SECTIONS DYNAMIC ROUTES ===================== */}
              <Route
                path="/sections/:subsection/:slug"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />
              <Route
                path="/sections/:slug"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />

              {/* ===================== EVENTS DYNAMIC ROUTES ===================== */}
              <Route
                path="/events/:slug"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />

              {/* ===================== ROOT LEVEL DYNAMIC PAGES ===================== */}
              <Route
                path="/:slug"
                element={
                  <PublicLayout>
                    <DynamicPageWrapper />
                  </PublicLayout>
                }
              />

              {/* ===================== CATCH-ALL 404 ROUTE ===================== */}
              <Route
                path="*"
                element={
                  <PublicLayout>
                    <ComingSoon title="Page Not Found" message="The page you're looking for doesn't exist." />
                  </PublicLayout>
                }
              />
            </Routes>
          </Router>
        </CMSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
