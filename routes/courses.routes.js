import express from 'express';
import { createCourse, deleteCourse, enrollCourse, getCourseById, getCourses, getEnrolledCourses, updateCourse } from '../controllers/courses.controller.js';

const router = express.Router();

router.post('/', createCourse);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.post('/enroll/:id', enrollCourse);
router.get('/enrolled', getEnrolledCourses);


export default router;