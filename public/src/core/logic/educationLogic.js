import { GRAD_SCHOOL_DEGREE_TITLES, SKILL_TRACKS } from '../constants.js';

export function addStudentLoanPayment(age, studentLoanAmount, isStudent) {
        if (age >= 18 && studentLoanAmount > 0 && !isStudent) {
            return Math.min(2400, studentLoanAmount);
        }
        return 0;
};

export function checkSchoolGraduated(currentSchoolYear, enrolledSchoolYears) {
    return currentSchoolYear >= enrolledSchoolYears;
}

export function checkLifeStatus(user) {
    if (user.inPrison) {
        return user.facilityName ? `Inmate (${user.facilityName})` : "Inmate";
    } else if (user.isRetired && !user.jobTitle && !user.hasBusiness) {
        return "Retired";
    } else if (user.gradSchoolEnrolled) {
       return `${user.gradSchoolType} Student`;
    } else if (user.universityEnrolled) {
       return "University Student";
    } else if (user.hasBusiness) {
       return "CEO & Founder";
    } else if (user.jobTitle) {
       return user.jobTitle;
    } else if (user.gradSchoolDegree) {
       return `${user.gradSchoolDegree} Graduate`;
    } else if (user.universityGraduated) {
       return "University Graduate";
    } else if (user.highSchoolGraduated) {
       return "High School Graduate";
    } else if (user.age > 17 && user.highSchoolRetained) {
       return "Student (Retaking)";
    } else if (user.age > 17 && !user.jobTitle) {
       return "Unemployed";
    } else if (user.age === 0) {
       return "Baby";
    } else if (user.age < 5) {
       return "Toddler";
    } else if (user.age < 18 && !user.highSchoolGraduated) {
       return "Student";
    } else if (user.age < 18 && user.highSchoolGraduated) {
       return "High School Graduate";
    }
}

/**
 * Returns an array of completed education milestones for a character.
 * Formats:
 * - High School: "High School Diploma" or "High School Equivalency (GED)"
 * - University: "Bachelor's Degree in {Major}"
 * - Graduate School: "Master's Degree in Business", "Juris Doctor in Law", "Doctor of Medicine (M.D.)", "Doctorate in Psychiatry"
 * 
 * @param {Object} user 
 * @returns {Array<{ id: string, title: string, category: string, icon: string, color: string, major?: string, school?: string }>}
 */
export function getEducationMilestones(user) {
    if (!user) return [];
    
    const milestones = [];
    const seenIds = new Set();

    const addMilestone = (milestone) => {
        if (!milestone || !milestone.title) return;
        const key = milestone.id || milestone.title;
        if (!seenIds.has(key)) {
            seenIds.add(key);
            milestones.push(milestone);
        }
    };

    // 1. Explicit user.educationMilestones or user.degrees if populated
    if (Array.isArray(user.educationMilestones)) {
        user.educationMilestones.forEach(m => {
            if (typeof m === 'string') {
                addMilestone({ id: m, title: m, category: 'custom', icon: 'fa-graduation-cap', color: 'indigo' });
            } else if (m && m.title) {
                addMilestone(m);
            }
        });
    }

    if (Array.isArray(user.degrees)) {
        user.degrees.forEach(d => {
            if (typeof d === 'string') {
                addMilestone({ id: d, title: d, category: 'custom', icon: 'fa-graduation-cap', color: 'indigo' });
            } else if (d && d.title) {
                addMilestone(d);
            }
        });
    }

    // 2. High School Diploma or GED
    if (user.hasGED) {
        addMilestone({
            id: 'ged',
            title: 'High School Equivalency (GED)',
            category: 'high_school',
            icon: 'fa-school',
            color: 'emerald'
        });
    } else if (user.highSchoolGraduated || user.universityGraduated || user.gradSchoolDegree) {
        addMilestone({
            id: 'high_school',
            title: 'High School Diploma',
            category: 'high_school',
            icon: 'fa-school',
            color: 'emerald'
        });
    }

    // 3. University Bachelor's Degree
    if (user.universityGraduated || user.gradSchoolDegree) {
        const majorName = user.major ? String(user.major).trim() : null;
        const title = majorName ? `Bachelor's Degree in ${majorName}` : "Bachelor's Degree";
        addMilestone({
            id: `bachelor_${majorName || 'general'}`,
            title: title,
            major: majorName,
            category: 'undergrad',
            icon: 'fa-graduation-cap',
            color: 'blue'
        });
    }

    // 4. Graduate School Degrees
    const gradDegrees = [];
    if (user.gradSchoolDegree) gradDegrees.push(user.gradSchoolDegree);
    if (Array.isArray(user.gradSchoolDegrees)) {
        user.gradSchoolDegrees.forEach(gd => {
            if (gd && !gradDegrees.includes(gd)) gradDegrees.push(gd);
        });
    }

    gradDegrees.forEach(deg => {
        const title = GRAD_SCHOOL_DEGREE_TITLES[deg] || (deg.endsWith('Degree') || deg.endsWith('Diploma') ? deg : `Graduate Degree from ${deg}`);
        addMilestone({
            id: `grad_${deg}`,
            title: title,
            school: deg,
            category: 'grad',
            icon: 'fa-user-graduate',
            color: 'purple'
        });
    });

    // 5. Skill Certifications
    if (user.skills && typeof user.skills === 'object') {
        SKILL_TRACKS.forEach(skill => {
            const st = user.skills[skill.key];
            if (st && st.certified) {
                addMilestone({
                    id: `cert_${skill.key}`,
                    title: skill.certificateTitle,
                    skillKey: skill.key,
                    category: 'certification',
                    icon: 'fa-certificate',
                    color: skill.color || 'indigo'
                });
            }
        });
    }

    return milestones;
}

/**
 * Returns a formatted delimiter-separated string of education milestones.
 * e.g. "High School Diploma, Bachelor's Degree in Psychology, Master's Degree in Business"
 * 
 * @param {Object} user 
 * @param {string} delimiter 
 * @param {string} fallback 
 * @returns {string}
 */
export function formatEducationMilestones(user, delimiter = ', ', fallback = 'No Formal Education') {
    const milestones = getEducationMilestones(user);
    if (!milestones.length) return fallback;
    return milestones.map(m => m.title).join(delimiter);
}

/**
 * Returns current enrollment status for a character.
 * 
 * @param {Object} user 
 * @returns {{ isEnrolled: boolean, level: string, label: string, detail: string, icon: string, color: string }}
 */
export function getCurrentEducationStatus(user) {
    if (!user) {
        return { isEnrolled: false, level: 'None', label: 'None', detail: '', icon: 'fa-book', color: 'slate' };
    }

    if (user.gradSchoolEnrolled) {
        return {
            isEnrolled: true,
            level: 'Graduate School',
            label: `${user.gradSchoolType || 'Graduate School'} Student`,
            detail: `Year ${(user.gradSchoolYear || 0) + 1}`,
            icon: 'fa-user-graduate',
            color: 'purple'
        };
    }

    if (user.universityEnrolled) {
        return {
            isEnrolled: true,
            level: 'University',
            label: 'University Student',
            detail: user.major ? `Year ${user.universitySchoolYear || 1} • ${user.major}` : `Year ${user.universitySchoolYear || 1}`,
            icon: 'fa-graduation-cap',
            color: 'blue'
        };
    }

    if (user.age >= 14 && user.age < 18 && !user.highSchoolGraduated) {
        return {
            isEnrolled: true,
            level: 'High School',
            label: 'High School Student',
            detail: `Year ${Math.max(1, user.age - 13)}`,
            icon: 'fa-school',
            color: 'emerald'
        };
    }

    if (user.age >= 18 && user.highSchoolRetained) {
        return {
            isEnrolled: true,
            level: 'High School',
            label: 'High School Student (Retaking)',
            detail: 'Senior Year',
            icon: 'fa-school',
            color: 'yellow'
        };
    }

    if (user.age >= 12 && user.age < 14) {
        return {
            isEnrolled: true,
            level: 'Middle School',
            label: 'Middle School Student',
            detail: `Grade ${user.age - 5}`,
            icon: 'fa-school',
            color: 'emerald'
        };
    }

    if (user.age >= 5 && user.age < 12) {
        return {
            isEnrolled: true,
            level: 'Elementary School',
            label: 'Elementary Student',
            detail: `Grade ${Math.max(1, user.age - 5)}`,
            icon: 'fa-school',
            color: 'emerald'
        };
    }

    return {
        isEnrolled: false,
        level: 'None',
        label: 'Not Enrolled',
        detail: '',
        icon: 'fa-book',
        color: 'slate'
    };
}
