
import { Instructor, TeacherRating as InstructorRating } from "../db/DB";
import { POST } from "../search/retryableSearch";

const SCHOOL_ID = "U2Nob29sLTEwNzg=";


export default async function searchRMP(instructorName: string, classCode: string): Promise<Instructor|null> {
    // UCSC class search doesn't include spaces
    let splitName = instructorName.split(",");
    let query = splitName[0];
    let className = classCode.split(" - ")[0].replace(" ", "");

    if (query.includes(" ")) {
        query = (query.split(" ").pop() || "") + (splitName[1] ? ", " + splitName[1].replaceAll(".", "") : "");
    }

    let resp = await POST("https://www.ratemyprofessors.com/graphql",
        {
            query: `query NewSearchTeachersQuery(
                $query: TeacherSearchQuery!
              ) {
                newSearch {
                  teachers(query: $query) {
                    didFallback
                    edges {
                      node {
                        id
                        legacyId
                        firstName
                        lastName
                        department
                        courseCodes {
                            courseName
                            courseCount
                        }
                        ...RatingDistributionWrapper_teacher
                        ...TeacherInfo_teacher
                        ...TeacherRatingTabs_teacher
                      }
                    }
                  }
                }
            }
                
                fragment RatingDistributionWrapper_teacher on Teacher {
                ...NoRatingsArea_teacher
                ratingsDistribution {
                    total
                    ...RatingDistributionChart_ratingsDistribution
                }
                }
                
                fragment TeacherInfo_teacher on Teacher {
                id
                lastName
                numRatings
                ...RatingValue_teacher
                ...NameTitle_teacher
                ...TeacherTags_teacher
                ...TeacherFeedback_teacher
                }
                
                fragment TeacherRatingTabs_teacher on Teacher {
                numRatings
                ...RatingsList_teacher
                }
                
                fragment RatingsList_teacher on Teacher {
                id
                legacyId
                lastName
                numRatings
                ...NoRatingsArea_teacher
                ratings(first: 20) {
                    edges {
                    node {
                        ...Rating_rating
                        id
                    }
                    }
                }
                }
                
                fragment NoRatingsArea_teacher on Teacher {
                lastName
                }
                
                fragment Rating_rating on Rating {
                comment
                teacherNote {
                    id
                }
                ...RatingHeader_rating
                ...RatingSuperHeader_rating
                ...RatingValues_rating
                ...CourseMeta_rating
                ...RatingTags_rating
                ...RatingFooter_rating
                ...ProfessorNoteSection_rating
                }
                
                fragment RatingHeader_rating on Rating {
                legacyId
                date
                class
                helpfulRating
                clarityRating
                isForOnlineClass
                }
                
                fragment RatingSuperHeader_rating on Rating {
                legacyId
                }
                
                fragment RatingValues_rating on Rating {
                helpfulRating
                clarityRating
                difficultyRating
                }
                
                fragment CourseMeta_rating on Rating {
                attendanceMandatory
                wouldTakeAgain
                grade
                textbookUse
                isForOnlineClass
                isForCredit
                }
                
                fragment RatingTags_rating on Rating {
                ratingTags
                }
                
                fragment RatingFooter_rating on Rating {
                id
                comment
                adminReviewedAt
                legacyId
                thumbsUpTotal
                thumbsDownTotal
                teacherNote {
                    id
                }
                }
                
                fragment ProfessorNoteSection_rating on Rating {
                teacherNote {
                    ...ProfessorNote_note
                    id
                }
                ...ProfessorNoteEditor_rating
                }
                
                fragment ProfessorNote_note on TeacherNotes {
                comment
                ...ProfessorNoteHeader_note
                ...ProfessorNoteFooter_note
                }
                
                fragment ProfessorNoteEditor_rating on Rating {
                id
                legacyId
                class
                teacherNote {
                    id
                    teacherId
                    comment
                }
                }
                
                fragment ProfessorNoteHeader_note on TeacherNotes {
                createdAt
                updatedAt
                }
                
                fragment ProfessorNoteFooter_note on TeacherNotes {
                legacyId
                }
                
                fragment RatingValue_teacher on Teacher {
                avgRating
                numRatings
                ...NumRatingsLink_teacher
                }
                
                fragment NameTitle_teacher on Teacher {
                id
                firstName
                lastName
                department
                }
                
                fragment TeacherTags_teacher on Teacher {
                lastName
                teacherRatingTags {
                    legacyId
                    tagCount
                    tagName
                    id
                }
                }
                
                fragment TeacherFeedback_teacher on Teacher {
                numRatings
                avgDifficulty
                wouldTakeAgainPercent
                }
                
                fragment NumRatingsLink_teacher on Teacher {
                numRatings
                }
                
                fragment RatingDistributionChart_ratingsDistribution on ratingsDistribution {
                r1
                r2
                r3
                r4
                r5
                }`,
            variables: {
                query: {
                    schoolID: SCHOOL_ID,
                    text: query
                }
            }
        }, {
            headers: {
                Authorization: "Basic dGVzdDp0ZXN0", // guest account auth, always the same ("test:test")
                "Content-Type": "application/json",
                DNT: "1"
            }
        });
    
    if (resp.status !== 200) {
        throw new Error("Could not search RateMyProfessor");
    }

    if (!resp.data.data) {
        throw new Error(`Could not search RateMyProfessor: ${JSON.stringify(resp.data)}`);
    }

    // RMP can return null here when the search function is down
    if (resp.data.data.newSearch.teachers === null) {
        console.warn("WARNING: RateMyProfessor search is currently DOWN. Reviews will NOT be generated.")
        return null;
    }
    
    // This won't match the instructor 100% of the time but it's good enough...    
    let instructors = resp.data.data.newSearch.teachers.edges.map(x => x.node);

    if (instructors.length === 0) return null;

    let similarityScore = instructors.map((b) =>
            // Check if last name matches
            (b.lastName.endsWith(query) ? 1 : -10) +
            // Check if first initial matches
            (b.firstName.startsWith(splitName[1][0]) ? 1 : -1) +
            // Check if this instructor has taught courses like this
            (b.courseCodes.map(x => x.courseName.replace(/([0-9 ]+.+)|(AND.+)/gm, "")).includes(className.replace(/([0-9 ]+.+)|(AND.+)/gm, "")) ? 1 : -1) +
            // Check if this instructor has taught this course
            (b.courseCodes.map(x => x.courseName).includes(className) ? 5 : -1)
        );
    
    // get the index of the instructor with the highest similarity score
    let index = similarityScore.indexOf(Math.max(...similarityScore));
    
    let instructor = instructors[index];

    // sanity check; ensure the last name is the same
    if (!instructor.lastName.endsWith(query)) {
        return null;
    }

    let relatedReviews: InstructorRating[] = [];
    let otherReviews: InstructorRating[] = [];
    for (let i = 0; i < instructor.ratings.edges.length; i++) {
        let raw = instructor.ratings.edges[i].node;
        let review: InstructorRating = {
            class: raw.class,
            postedAt: new Date(raw.date).getTime(),
            difficultyRating: raw.difficultyRating,
            rating: (raw.helpfulRating + raw.clarityRating) / 2, // why does RMP do this ???
            likes: raw.thumbsUpTotal,
            dislikes: raw.thumbsDownTotal,
            wouldTakeAgain: raw.wouldTakeAgain === 1,
            credit: raw.isForCredit,
            online: raw.isForOnlineClass,
            attendance: raw.attendanceMandatory === "mandatory",
            comment: raw.comment,
            tags: raw.ratingTags,
            related: false
        }
        if (className.includes(review.class) || review.class.includes(className)) {
            review.related = true;
            relatedReviews.push(review);
        } else {
            otherReviews.push(review);
        }
    }

    let totalRatings = relatedReviews.length + otherReviews.length;
    if (
        (instructor.avgDifficulty === 0 && instructor.avgRating === 0) ||
        instructor.numRatings === 0 ||
        instructor.numRatings < totalRatings
    ) {
        // Sometimes RMP provides incorrect information in search,
        // so we'll recalculate it from the reviews we have
        instructor.numRatings = totalRatings;
        instructor.avgRating = [...relatedReviews, ...otherReviews].reduce((a, b) => a + b.rating, 0) / totalRatings;
        instructor.avgDifficulty = [...relatedReviews, ...otherReviews].reduce((a, b) => a + b.difficultyRating, 0) / totalRatings;
    
        instructor.ratingsDistribution = {
            r1: [...relatedReviews, ...otherReviews].filter(x => x.rating === 1).length,
            r2: [...relatedReviews, ...otherReviews].filter(x => x.rating === 2).length,
            r3: [...relatedReviews, ...otherReviews].filter(x => x.rating === 3).length,
            r4: [...relatedReviews, ...otherReviews].filter(x => x.rating === 4).length,
            r5: [...relatedReviews, ...otherReviews].filter(x => x.rating === 5).length,
        }
    }

    return {
        id: instructor.legacyId,
        name: `${instructor.firstName} ${instructor.lastName}`,
        avgDifficulty: instructor.avgDifficulty,
        avgRating: instructor.avgRating,
        ratings: [instructor.ratingsDistribution.r1, instructor.ratingsDistribution.r2, instructor.ratingsDistribution.r3, instructor.ratingsDistribution.r4, instructor.ratingsDistribution.r5],
        numRatings: instructor.numRatings,
        wouldTakeAgainPercent: instructor.wouldTakeAgainPercent,
        reviews: [...relatedReviews, ...otherReviews]
    }
}