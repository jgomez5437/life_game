import { login } from '../auth/auth.js';
import { startGuestMode } from '../auth/loginScreen.js';
import { processQuarter, selectIndustry, enterBusinessMode, renderBusinessSetup } from '../features/business/businessDashboard.js';
import { confirmQuitCareer, quitCareer, renderCareerManager, renderJobMarket, renderCareerMarket } from '../features/career/careerJobsScreen.js';
import { attemptEnrollment, openGradEnrollmentModal, attemptGradEnrollment, renderEducation, renderGradSchoolMarket, openUniversityModal } from '../features/education/manageEducationScreen.js';
import { selectGender, submitCharacter } from '../features/player/charCreationScreen.js';
import { ageUp } from '../features/player/mainScreen.js';
