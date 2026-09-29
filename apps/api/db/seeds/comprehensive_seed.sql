CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_password_hash VARCHAR(255);
    v_admin_role_id BIGINT;
    v_teacher_role_id BIGINT;
    v_homeroom_role_id BIGINT;
    v_academic_year_id UUID;
    v_term_start DATE;
    v_term_end DATE;

    -- User IDs
    v_uid_admin UUID := 'a0000000-0000-4000-a000-000000000001'::uuid;
    v_uid_kepsek UUID := 'a0000000-0000-4000-a000-000000000002'::uuid;
    v_uid_budi UUID := 'a0000000-0000-4000-a000-000000000011'::uuid;
    v_uid_siti UUID := 'a0000000-0000-4000-a000-000000000012'::uuid;
    v_uid_ahmad UUID := 'a0000000-0000-4000-a000-000000000013'::uuid;
    v_uid_dewi UUID := 'a0000000-0000-4000-a000-000000000014'::uuid;
    v_uid_eko UUID := 'a0000000-0000-4000-a000-000000000015'::uuid;
    v_uid_ratna UUID := 'a0000000-0000-4000-a000-000000000016'::uuid;
    v_uid_hendra UUID := 'a0000000-0000-4000-a000-000000000017'::uuid;
    v_uid_nurul UUID := 'a0000000-0000-4000-a000-000000000018'::uuid;
    v_uid_agus UUID := 'a0000000-0000-4000-a000-000000000019'::uuid;
    v_uid_tri UUID := 'a0000000-0000-4000-a000-000000000020'::uuid;
    v_uid_fitri UUID := 'a0000000-0000-4000-a000-000000000021'::uuid;
    v_uid_rizky UUID := 'a0000000-0000-4000-a000-000000000022'::uuid;

    -- Class IDs
    v_cid_7a UUID := 'c0000000-0000-4000-c000-000000000071'::uuid;
    v_cid_7b UUID := 'c0000000-0000-4000-c000-000000000072'::uuid;
    v_cid_8a UUID := 'c0000000-0000-4000-c000-000000000081'::uuid;
    v_cid_8b UUID := 'c0000000-0000-4000-c000-000000000082'::uuid;
    v_cid_9a UUID := 'c0000000-0000-4000-c000-000000000091'::uuid;
    v_cid_9b UUID := 'c0000000-0000-4000-c000-000000000092'::uuid;

    -- Subject IDs
    v_sub_mat UUID := 'b0000000-0000-4000-b000-000000000001'::uuid;
    v_sub_ipa UUID := 'b0000000-0000-4000-b000-000000000002'::uuid;
    v_sub_ips UUID := 'b0000000-0000-4000-b000-000000000003'::uuid;
    v_sub_bin UUID := 'b0000000-0000-4000-b000-000000000004'::uuid;
    v_sub_big UUID := 'b0000000-0000-4000-b000-000000000005'::uuid;
    v_sub_pai UUID := 'b0000000-0000-4000-b000-000000000006'::uuid;
    v_sub_ppkn UUID := 'b0000000-0000-4000-b000-000000000007'::uuid;
    v_sub_pjok UUID := 'b0000000-0000-4000-b000-000000000008'::uuid;
    v_sub_sbk UUID := 'b0000000-0000-4000-b000-000000000009'::uuid;
    v_sub_info UUID := 'b0000000-0000-4000-b000-000000000010'::uuid;

BEGIN
    -- 1. Setup Password Hash (Password: Password123!)
    BEGIN
        v_password_hash := crypt('Password123!', gen_salt('bf', 10));
    EXCEPTION WHEN OTHERS THEN
        v_password_hash := '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5F7.4cK90A5/6eG49iH4cT6MvXo/S';
    END;

    -- 2. Ensure Roles Exist
    INSERT INTO roles (name, description) VALUES
        ('SUPER_ADMIN', 'Full system administration'),
        ('TEACHER', 'Teacher account'),
        ('HOMEROOM_TEACHER', 'Homeroom teacher responsibilities')
    ON CONFLICT (name) DO NOTHING;

    SELECT role_id INTO v_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';
    SELECT role_id INTO v_teacher_role_id FROM roles WHERE name = 'TEACHER';
    SELECT role_id INTO v_homeroom_role_id FROM roles WHERE name = 'HOMEROOM_TEACHER';

    -- 3. Resolve or Create Active Academic Year
    SELECT id, starts_on, ends_on INTO v_academic_year_id, v_term_start, v_term_end
    FROM academic_years
    WHERE active
    LIMIT 1;

    IF v_academic_year_id IS NULL THEN
        -- Check if any academic year exists
        SELECT id, starts_on, ends_on INTO v_academic_year_id, v_term_start, v_term_end
        FROM academic_years
        ORDER BY starts_on DESC
        LIMIT 1;

        IF v_academic_year_id IS NOT NULL THEN
            UPDATE academic_years SET active = TRUE WHERE id = v_academic_year_id;
        ELSE
            v_academic_year_id := '00000000-0000-4000-8000-000000000013'::uuid;
            v_term_start := DATE '2026-07-01';
            v_term_end := DATE '2026-12-31';
            INSERT INTO academic_years (id, name, semester, starts_on, ends_on, active)
            VALUES (v_academic_year_id, '2026/2027', 1, v_term_start, v_term_end, TRUE);
        END IF;
    END IF;

    -- 4. Seed Users
    INSERT INTO users (id, email, password, name, is_active, created_at, updated_at) VALUES
        (v_uid_admin, 'admin@attendly.sch.id', v_password_hash, 'Administrator Sistem', TRUE, NOW(), NOW()),
        (v_uid_kepsek, 'kepsek@attendly.sch.id', v_password_hash, 'Drs. H. Mulyadi, M.Pd.', TRUE, NOW(), NOW()),
        (v_uid_budi, 'budi.santoso@attendly.sch.id', v_password_hash, 'Budi Santoso, S.Pd.', TRUE, NOW(), NOW()),
        (v_uid_siti, 'siti.aminah@attendly.sch.id', v_password_hash, 'Siti Aminah, M.Pd.', TRUE, NOW(), NOW()),
        (v_uid_ahmad, 'ahmad.dahlan@attendly.sch.id', v_password_hash, 'Ahmad Dahlan, S.Pd.', TRUE, NOW(), NOW()),
        (v_uid_dewi, 'dewi.lestari@attendly.sch.id', v_password_hash, 'Dewi Lestari, S.Si.', TRUE, NOW(), NOW()),
        (v_uid_eko, 'eko.prasetyo@attendly.sch.id', v_password_hash, 'Eko Prasetyo, M.Kom.', TRUE, NOW(), NOW()),
        (v_uid_ratna, 'ratna.saridewi@attendly.sch.id', v_password_hash, 'Ratna Sari Dewi, S.Pd.', TRUE, NOW(), NOW()),
        (v_uid_hendra, 'hendra.wijaya@attendly.sch.id', v_password_hash, 'Hendra Wijaya, S.Pd.', TRUE, NOW(), NOW()),
        (v_uid_nurul, 'nurul.hidayah@attendly.sch.id', v_password_hash, 'Nurul Hidayah, S.Ag.', TRUE, NOW(), NOW()),
        (v_uid_agus, 'agus.setiawan@attendly.sch.id', v_password_hash, 'Agus Setiawan, S.Or.', TRUE, NOW(), NOW()),
        (v_uid_tri, 'tri.wahyuni@attendly.sch.id', v_password_hash, 'Tri Wahyuni, S.Sn.', TRUE, NOW(), NOW()),
        (v_uid_fitri, 'fitri.handayani@attendly.sch.id', v_password_hash, 'Fitri Handayani, S.Pd.', TRUE, NOW(), NOW()),
        (v_uid_rizky, 'rizky.ramadhan@attendly.sch.id', v_password_hash, 'Rizky Ramadhan, S.Pd.', TRUE, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        is_active = TRUE;

    -- 5. Seed User Roles
    -- Super Admins
    INSERT INTO user_roles (user_id, role_id) VALUES
        (v_uid_admin, v_admin_role_id),
        (v_uid_kepsek, v_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Homeroom Teachers (Wali Kelas + Teacher Role)
    INSERT INTO user_roles (user_id, role_id) VALUES
        (v_uid_budi, v_teacher_role_id), (v_uid_budi, v_homeroom_role_id),
        (v_uid_siti, v_teacher_role_id), (v_uid_siti, v_homeroom_role_id),
        (v_uid_ahmad, v_teacher_role_id), (v_uid_ahmad, v_homeroom_role_id),
        (v_uid_dewi, v_teacher_role_id), (v_uid_dewi, v_homeroom_role_id),
        (v_uid_eko, v_teacher_role_id), (v_uid_eko, v_homeroom_role_id),
        (v_uid_ratna, v_teacher_role_id), (v_uid_ratna, v_homeroom_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Subject Teachers (Teacher Role)
    INSERT INTO user_roles (user_id, role_id) VALUES
        (v_uid_hendra, v_teacher_role_id),
        (v_uid_nurul, v_teacher_role_id),
        (v_uid_agus, v_teacher_role_id),
        (v_uid_tri, v_teacher_role_id),
        (v_uid_fitri, v_teacher_role_id),
        (v_uid_rizky, v_teacher_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- 6. Seed Teachers Table
    INSERT INTO teachers (id, user_id, nip, phone, status, created_at, updated_at) VALUES
        (uuid_generate_v4(), v_uid_budi, '198001152005011001', '081234567801', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_siti, '198203202006042002', '081234567802', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_ahmad, '197805122003121003', '081234567803', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_dewi, '198509182009022004', '081234567804', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_eko, '198111042008011005', '081234567805', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_ratna, '198704252010012006', '081234567806', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_hendra, '198302142007011007', '081234567807', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_nurul, '197908092005012008', '081234567808', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_agus, '198606112009031009', '081234567809', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_tri, '198412032008022010', '081234567810', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_fitri, '198905152014022011', '081234567811', 'ACTIVE', NOW(), NOW()),
        (uuid_generate_v4(), v_uid_rizky, '199001012015011012', '081234567812', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        nip = EXCLUDED.nip,
        phone = EXCLUDED.phone,
        status = 'ACTIVE';

    -- 7. Seed Subjects
    INSERT INTO subjects (id, code, name, created_at, updated_at) VALUES
        (v_sub_mat, 'MAT', 'Matematika', NOW(), NOW()),
        (v_sub_ipa, 'IPA', 'Ilmu Pengetahuan Alam', NOW(), NOW()),
        (v_sub_ips, 'IPS', 'Ilmu Pengetahuan Sosial', NOW(), NOW()),
        (v_sub_bin, 'BIN', 'Bahasa Indonesia', NOW(), NOW()),
        (v_sub_big, 'BIG', 'Bahasa Inggris', NOW(), NOW()),
        (v_sub_pai, 'PAI', 'Pendidikan Agama Islam', NOW(), NOW()),
        (v_sub_ppkn, 'PPKN', 'Pendidikan Pancasila & Kewarganegaraan', NOW(), NOW()),
        (v_sub_pjok, 'PJOK', 'Pendidikan Jasmani & Olahraga', NOW(), NOW()),
        (v_sub_sbk, 'SBK', 'Seni Budaya & Keterampilan', NOW(), NOW()),
        (v_sub_info, 'INFO', 'Informatika', NOW(), NOW())
    ON CONFLICT (code) WHERE deleted_at IS NULL DO UPDATE SET
        name = EXCLUDED.name,
        deleted_at = NULL;

    -- 8. Seed Classes
    INSERT INTO classes (id, name, code, grade, section, homeroom_teacher_id, academic_year_id, created_at, updated_at) VALUES
        (v_cid_7a, 'VII-A', 'CLS-7A', '7', 'A', v_uid_budi, v_academic_year_id, NOW(), NOW()),
        (v_cid_7b, 'VII-B', 'CLS-7B', '7', 'B', v_uid_siti, v_academic_year_id, NOW(), NOW()),
        (v_cid_8a, 'VIII-A', 'CLS-8A', '8', 'A', v_uid_ahmad, v_academic_year_id, NOW(), NOW()),
        (v_cid_8b, 'VIII-B', 'CLS-8B', '8', 'B', v_uid_dewi, v_academic_year_id, NOW(), NOW()),
        (v_cid_9a, 'IX-A', 'CLS-9A', '9', 'A', v_uid_eko, v_academic_year_id, NOW(), NOW()),
        (v_cid_9b, 'IX-B', 'CLS-9B', '9', 'B', v_uid_ratna, v_academic_year_id, NOW(), NOW())
    ON CONFLICT (code) WHERE deleted_at IS NULL DO UPDATE SET
        name = EXCLUDED.name,
        grade = EXCLUDED.grade,
        section = EXCLUDED.section,
        homeroom_teacher_id = EXCLUDED.homeroom_teacher_id,
        academic_year_id = EXCLUDED.academic_year_id,
        deleted_at = NULL;

    -- 9. Seed Teaching Assignments (All 6 Classes * 10 Subjects)
    -- VII-A
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_budi, v_cid_7a, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_7a, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_7a, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_7a, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_ratna, v_cid_7a, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_7a, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_7a, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_7a, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_7a, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_7a, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

    -- VII-B
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_hendra, v_cid_7b, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_7b, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_7b, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_7b, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_rizky, v_cid_7b, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_7b, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_7b, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_7b, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_7b, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_7b, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

    -- VIII-A
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_budi, v_cid_8a, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_8a, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_8a, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_8a, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_ratna, v_cid_8a, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_8a, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_8a, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_8a, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_8a, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_8a, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

    -- VIII-B
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_hendra, v_cid_8b, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_8b, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_8b, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_8b, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_rizky, v_cid_8b, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_8b, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_8b, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_8b, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_8b, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_8b, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

    -- IX-A
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_budi, v_cid_9a, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_9a, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_9a, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_9a, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_ratna, v_cid_9a, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_9a, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_9a, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_9a, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_9a, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_9a, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

    -- IX-B
    INSERT INTO teaching_assignments (teacher_id, class_id, subject_id, academic_year_id, active) VALUES
        (v_uid_hendra, v_cid_9b, v_sub_mat, v_academic_year_id, TRUE),
        (v_uid_dewi, v_cid_9b, v_sub_ipa, v_academic_year_id, TRUE),
        (v_uid_ahmad, v_cid_9b, v_sub_ips, v_academic_year_id, TRUE),
        (v_uid_siti, v_cid_9b, v_sub_bin, v_academic_year_id, TRUE),
        (v_uid_rizky, v_cid_9b, v_sub_big, v_academic_year_id, TRUE),
        (v_uid_nurul, v_cid_9b, v_sub_pai, v_academic_year_id, TRUE),
        (v_uid_fitri, v_cid_9b, v_sub_ppkn, v_academic_year_id, TRUE),
        (v_uid_agus, v_cid_9b, v_sub_pjok, v_academic_year_id, TRUE),
        (v_uid_tri, v_cid_9b, v_sub_sbk, v_academic_year_id, TRUE),
        (v_uid_eko, v_cid_9b, v_sub_info, v_academic_year_id, TRUE)
    ON CONFLICT (teacher_id, class_id, subject_id, academic_year_id) WHERE active DO NOTHING;

END $$;

-- ==============================================================================
-- 10. Seed 150 Students (25 students per class) and Active Enrollments
-- ==============================================================================
DO $$
DECLARE
    r_class RECORD;
    v_idx INT;
    v_sid UUID;
    v_nis VARCHAR(50);
    v_nisn VARCHAR(50);
    v_name VARCHAR(255);
    v_first_names TEXT[] := ARRAY[
        'Aditya', 'Ahmad', 'Alif', 'Ananda', 'Annisa',
        'Arya', 'Bayu', 'Bima', 'Cantika', 'Citra',
        'Daffa', 'Danendra', 'Dewi', 'Dimas', 'Fadhil',
        'Farhan', 'Fathia', 'Galih', 'Gita', 'Hafizh',
        'Ilham', 'Indah', 'Intan', 'Kevin', 'Lestari',
        'Maulana', 'Nabila', 'Naufal', 'Putri', 'Rafi',
        'Raihan', 'Rangga', 'Rian', 'Rina', 'Rizky',
        'Salsa', 'Septian', 'Syifa', 'Tegar', 'Tiara',
        'Vina', 'Wahyu', 'Wulan', 'Yoga', 'Zahra'
    ];
    v_last_names TEXT[] := ARRAY[
        'Pratama', 'Saputra', 'Kusuma', 'Wijaya', 'Permana',
        'Nugraha', 'Hidayat', 'Ramadhan', 'Setiawan', 'Firmansyah',
        'Putra', 'Putri', 'Utami', 'Lestari', 'Wulandari',
        'Santoso', 'Gunawan', 'Susanto', 'Suryono', 'Mahendra',
        'Suharto', 'Purnomo', 'Budiman', 'Yuliana', 'Anggraini'
    ];
    v_num_first INT := array_length(v_first_names, 1);
    v_num_last INT := array_length(v_last_names, 1);
BEGIN
    FOR r_class IN SELECT id, code, grade, section FROM classes WHERE deleted_at IS NULL ORDER BY code LOOP
        FOR v_idx IN 1..25 LOOP
            -- Deterministic NIS & NISN
            v_nis := '2425' || LPAD(r_class.grade, 2, '0') || LPAD(((ASCII(r_class.section) - 64) * 100 + v_idx)::text, 3, '0');
            v_nisn := '00' || LPAD(r_class.grade, 2, '0') || LPAD(((ASCII(r_class.section) - 64) * 1000 + v_idx)::text, 6, '0');

            v_name := v_first_names[1 + ((v_idx * 7 + ASCII(r_class.section) * 3) % v_num_first)] || ' ' ||
                      v_last_names[1 + ((v_idx * 11 + ASCII(r_class.section) * 5) % v_num_last)];

            SELECT id INTO v_sid FROM students WHERE student_number = v_nis;

            IF v_sid IS NULL THEN
                v_sid := uuid_generate_v4();
                INSERT INTO students (id, student_number, nisn, full_name, class_id, active, created_at, updated_at)
                VALUES (v_sid, v_nis, v_nisn, v_name, r_class.id, TRUE, NOW(), NOW());
            ELSE
                UPDATE students SET
                    full_name = v_name,
                    class_id = r_class.id,
                    active = TRUE
                WHERE id = v_sid;
            END IF;

            -- Ensure active enrollment
            INSERT INTO student_enrollments (id, student_id, class_id, valid_from, valid_to, created_at)
            SELECT uuid_generate_v4(), v_sid, r_class.id, DATE '2026-07-01', NULL, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM student_enrollments WHERE student_id = v_sid AND valid_to IS NULL
            );
        END LOOP;
    END LOOP;
END $$;

-- ==============================================================================
-- 11. Seed Class Schedules (Non-overlapping Weekly Grid across Monday - Friday)
-- ==============================================================================
-- Time slots:
-- Slot 1: 07:30 - 09:00
-- Slot 2: 09:15 - 10:45
-- Slot 3: 11:00 - 12:30
-- Slot 4: 13:15 - 14:45
-- Day of week: 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat
-- ==============================================================================
DO $$
DECLARE
    v_term_start DATE;
    v_term_end DATE;
    v_ay_id UUID;
BEGIN
    SELECT id, starts_on, ends_on INTO v_ay_id, v_term_start, v_term_end
    FROM academic_years WHERE active LIMIT 1;

    -- Temporary table to hold schedule definitions
    CREATE TEMP TABLE tmp_sched_plan (
        class_code VARCHAR(20),
        subject_code VARCHAR(20),
        day_of_week SMALLINT,
        starts_at TIME,
        ends_at TIME
    ) ON COMMIT DROP;

    -- Deterministic, mathematically collision-free schedule grid:
    -- 10 subjects mapped cyclically across 6 classes and 10 periods (2 slots/day x 5 days)
    -- Guaranteed: zero teacher time overlap, zero class time overlap.
    INSERT INTO tmp_sched_plan (class_code, subject_code, day_of_week, starts_at, ends_at)
    WITH periods AS (
        SELECT
            p,
            (1 + (p / 2))::smallint AS dow,
            CASE WHEN (p % 2) = 0 THEN '07:30:00'::time ELSE '09:15:00'::time END AS starts_at,
            CASE WHEN (p % 2) = 0 THEN '09:00:00'::time ELSE '10:45:00'::time END AS ends_at
        FROM generate_series(0, 9) AS p
    ),
    classes_offsets AS (
        SELECT 'CLS-7A' AS class_code, 0 AS offset_val UNION ALL
        SELECT 'CLS-7B', 1 UNION ALL
        SELECT 'CLS-8A', 2 UNION ALL
        SELECT 'CLS-8B', 3 UNION ALL
        SELECT 'CLS-9A', 4 UNION ALL
        SELECT 'CLS-9B', 5
    ),
    subject_array AS (
        SELECT ARRAY['MAT', 'IPA', 'IPS', 'BIN', 'BIG', 'PAI', 'PPKN', 'PJOK', 'SBK', 'INFO'] AS subs
    )
    SELECT
        co.class_code,
        sa.subs[1 + ((p.p + co.offset_val) % 10)] AS subject_code,
        p.dow AS day_of_week,
        p.starts_at,
        p.ends_at
    FROM periods p
    CROSS JOIN classes_offsets co
    CROSS JOIN subject_array sa;

    -- Insert into class_schedules with scope set automatically by trigger
    INSERT INTO class_schedules (
        teaching_assignment_id,
        teacher_id,
        class_id,
        academic_year_id,
        day_of_week,
        starts_at,
        ends_at,
        effective_from,
        effective_until,
        active
    )
    SELECT
        ta.id,
        ta.teacher_id,
        ta.class_id,
        ta.academic_year_id,
        p.day_of_week,
        p.starts_at,
        p.ends_at,
        v_term_start,
        v_term_end,
        TRUE
    FROM tmp_sched_plan p
    JOIN classes c ON c.code = p.class_code
    JOIN subjects s ON s.code = p.subject_code
    JOIN teaching_assignments ta ON ta.class_id = c.id AND ta.subject_id = s.id AND ta.active
    WHERE NOT EXISTS (
        SELECT 1 FROM class_schedules cs
        WHERE cs.teaching_assignment_id = ta.id
          AND cs.day_of_week = p.day_of_week
          AND cs.starts_at = p.starts_at
          AND cs.active
    );
END $$;

-- ==============================================================================
-- 12. Seed Attendance Sessions & Student Records (Past 14 Days)
-- ==============================================================================
-- Creates realistic attendance history with varying statuses:
-- ~88% PRESENT, ~5% SICK, ~4% EXCUSED, ~3% UNEXCUSED_ABSENT
-- Includes SUBMITTED sessions, 2 REOPENED sessions, and today's DRAFT sessions.
-- ==============================================================================
DO $$
DECLARE
    r_day RECORD;
    r_sched RECORD;
    r_student RECORD;
    v_session_id UUID;
    v_held_at TIMESTAMPTZ;
    v_status VARCHAR(20);
    v_submitted_by UUID;
    v_submitted_at TIMESTAMPTZ;
    v_reopened_by UUID;
    v_reopened_at TIMESTAMPTZ;
    v_reopen_reason TEXT;
    v_roll INT;
    v_rec_status VARCHAR(24);
    v_remarks TEXT;
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
    -- Loop over school days from 14 days ago up to today (skipping Saturday and Sunday)
    FOR r_day IN
        SELECT (v_today - i * INTERVAL '1 day')::date AS d,
               EXTRACT(ISODOW FROM (v_today - i * INTERVAL '1 day'))::smallint AS dow,
               i AS days_ago
        FROM generate_series(0, 14) AS i
        WHERE EXTRACT(ISODOW FROM (v_today - i * INTERVAL '1 day')) BETWEEN 1 AND 5
        ORDER BY i DESC
    LOOP
        -- Find schedules for this day of week
        FOR r_sched IN
            SELECT cs.id AS schedule_id,
                   cs.class_id,
                   cs.teacher_id,
                   ta.subject_id,
                   cs.starts_at,
                   cs.ends_at
            FROM class_schedules cs
            JOIN teaching_assignments ta ON ta.id = cs.teaching_assignment_id
            WHERE cs.day_of_week = r_day.dow
              AND cs.active
              AND r_day.d >= cs.effective_from
              AND (cs.effective_until IS NULL OR r_day.d <= cs.effective_until)
        LOOP
            v_held_at := (r_day.d || ' ' || r_sched.starts_at)::timestamp AT TIME ZONE 'Asia/Jakarta';

            -- Check if session already exists for this schedule on this date
            SELECT id INTO v_session_id
            FROM attendance_sessions
            WHERE schedule_id = r_sched.schedule_id
              AND (held_at AT TIME ZONE 'Asia/Jakarta')::date = r_day.d;

            IF v_session_id IS NULL THEN
                v_session_id := uuid_generate_v4();

                -- Determine session status
                IF r_day.days_ago = 0 THEN
                    -- Today: DRAFT for teacher taking attendance in real time
                    v_status := 'DRAFT';
                    v_submitted_by := NULL;
                    v_submitted_at := NULL;
                    v_reopened_by := NULL;
                    v_reopened_at := NULL;
                    v_reopen_reason := NULL;
                ELSIF r_day.days_ago = 3 AND r_sched.starts_at = '07:30:00' THEN
                    -- Special case: REOPENED for testing reopening workflow
                    v_status := 'REOPENED';
                    v_submitted_by := r_sched.teacher_id;
                    v_submitted_at := v_held_at + INTERVAL '90 minutes';
                    v_reopened_by := 'a0000000-0000-4000-a000-000000000001'::uuid; -- Admin
                    v_reopened_at := v_held_at + INTERVAL '5 hours';
                    v_reopen_reason := 'Koreksi status kehadiran siswa sakit yang sebelumnya tercatat alpa';
                ELSE
                    -- Standard past sessions: SUBMITTED
                    v_status := 'SUBMITTED';
                    v_submitted_by := r_sched.teacher_id;
                    v_submitted_at := v_held_at + INTERVAL '85 minutes';
                    v_reopened_by := NULL;
                    v_reopened_at := NULL;
                    v_reopen_reason := NULL;
                END IF;

                INSERT INTO attendance_sessions (
                    id,
                    class_id,
                    subject_id,
                    teacher_id,
                    schedule_id,
                    held_at,
                    status,
                    version,
                    submitted_by,
                    submitted_at,
                    reopened_by,
                    reopened_at,
                    reopen_reason,
                    created_at,
                    updated_at
                ) VALUES (
                    v_session_id,
                    r_sched.class_id,
                    r_sched.subject_id,
                    r_sched.teacher_id,
                    r_sched.schedule_id,
                    v_held_at,
                    v_status,
                    CASE WHEN v_status = 'REOPENED' THEN 2 ELSE 1 END,
                    v_submitted_by,
                    v_submitted_at,
                    v_reopened_by,
                    v_reopened_at,
                    v_reopen_reason,
                    v_held_at,
                    COALESCE(v_submitted_at, v_held_at)
                );

                -- Insert attendance records for all active students enrolled in this class
                FOR r_student IN
                    SELECT s.id, s.full_name
                    FROM students s
                    JOIN student_enrollments se ON se.student_id = s.id AND se.class_id = r_sched.class_id AND se.valid_to IS NULL
                    WHERE s.active AND s.deleted_at IS NULL
                    ORDER BY s.student_number
                LOOP
                    -- Pseudorandom deterministic roll (1-100) based on student ID, day, and schedule
                    v_roll := 1 + (('x' || SUBSTR(MD5(r_student.id::text || r_day.d::text || r_sched.schedule_id::text), 1, 4))::bit(16)::int % 100);

                    IF v_roll <= 88 THEN
                        v_rec_status := 'PRESENT';
                        v_remarks := '';
                    ELSIF v_roll <= 93 THEN
                        v_rec_status := 'SICK';
                        v_remarks := CASE (v_roll % 3)
                            WHEN 0 THEN 'Demam dan flu'
                            WHEN 1 THEN 'Surat dokter terlampir'
                            ELSE 'Izin sakit rawat jalan'
                        END;
                    ELSIF v_roll <= 97 THEN
                        v_rec_status := 'EXCUSED';
                        v_remarks := CASE (v_roll % 3)
                            WHEN 0 THEN 'Keperluan keluarga'
                            WHEN 1 THEN 'Izin mengikuti lomba sains'
                            ELSE 'Acara keluarga di luar kota'
                        END;
                    ELSE
                        v_rec_status := 'UNEXCUSED_ABSENT';
                        v_remarks := 'Tanpa keterangan';
                    END IF;

                    INSERT INTO attendance_records (
                        session_id,
                        student_id,
                        status,
                        remarks,
                        recorded_at,
                        updated_at
                    ) VALUES (
                        v_session_id,
                        r_student.id,
                        v_rec_status,
                        v_remarks,
                        v_held_at + INTERVAL '10 minutes',
                        v_held_at + INTERVAL '10 minutes'
                    )
                    ON CONFLICT (session_id, student_id) DO NOTHING;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ==============================================================================
-- 13. Seed Audit Events & Export Jobs
-- ==============================================================================
DO $$
DECLARE
    v_admin_id UUID := 'a0000000-0000-4000-a000-000000000001'::uuid;
    v_teacher_budi UUID := 'a0000000-0000-4000-a000-000000000011'::uuid;
    v_cid_7a UUID := 'c0000000-0000-4000-c000-000000000071'::uuid;
    v_sample_session UUID;
BEGIN
    SELECT id INTO v_sample_session FROM attendance_sessions WHERE status = 'SUBMITTED' LIMIT 1;

    -- Audit Events
    INSERT INTO audit_events (actor_id, action, entity, entity_id, details, created_at) VALUES
        (v_admin_id, 'LOGIN', 'USER', v_admin_id, '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}', NOW() - INTERVAL '2 days'),
        (v_admin_id, 'CREATE', 'CLASS', v_cid_7a, '{"code": "CLS-7A", "name": "VII-A"}', NOW() - INTERVAL '30 days'),
        (v_admin_id, 'UPDATE', 'ACADEMIC_YEAR', '00000000-0000-4000-8000-000000000013'::uuid, '{"active": true, "name": "2026/2027"}', NOW() - INTERVAL '20 days'),
        (v_teacher_budi, 'LOGIN', 'USER', v_teacher_budi, '{"ip": "127.0.0.1", "device": "Chrome Windows"}', NOW() - INTERVAL '1 day');

    IF v_sample_session IS NOT NULL THEN
        INSERT INTO audit_events (actor_id, action, entity, entity_id, details, created_at) VALUES
            (v_teacher_budi, 'SUBMIT', 'ATTENDANCE_SESSION', v_sample_session, '{"total_present": 22, "total_sick": 2, "total_excused": 1, "total_absent": 0}', NOW() - INTERVAL '1 day'),
            (v_admin_id, 'EXPORT', 'ATTENDANCE_SESSION', v_sample_session, '{"format": "XLSX", "scope": "class_attendance"}', NOW() - INTERVAL '6 hours');
    END IF;

    -- Export Jobs
    INSERT INTO export_jobs (
        user_id,
        export_type,
        file_format,
        status,
        filter_params,
        storage_key,
        download_url,
        expires_at,
        created_at,
        updated_at
    ) VALUES
        (v_admin_id, 'ATTENDANCE_SUMMARY', 'XLSX', 'COMPLETED', '{"class_id": "c0000000-0000-4000-c000-000000000071", "format": "XLSX"}', 'exports/rekap_presensi_7a.xlsx', '/api/v1/exports/download/sample-7a.xlsx', NOW() + INTERVAL '18 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
        (v_admin_id, 'AUDIT_LOG', 'CSV', 'COMPLETED', '{"entity": "ATTENDANCE_SESSION", "format": "CSV"}', 'exports/audit_sessions.csv', '/api/v1/exports/download/sample-audit.csv', NOW() + INTERVAL '20 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours');

END $$;

-- Verify results
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM teachers) AS total_teachers,
    (SELECT COUNT(*) FROM classes) AS total_classes,
    (SELECT COUNT(*) FROM subjects) AS total_subjects,
    (SELECT COUNT(*) FROM students) AS total_students,
    (SELECT COUNT(*) FROM student_enrollments) AS total_enrollments,
    (SELECT COUNT(*) FROM teaching_assignments) AS total_assignments,
    (SELECT COUNT(*) FROM class_schedules) AS total_schedules,
    (SELECT COUNT(*) FROM attendance_sessions) AS total_sessions,
    (SELECT COUNT(*) FROM attendance_records) AS total_records,
    (SELECT COUNT(*) FROM audit_events) AS total_audit_events,
    (SELECT COUNT(*) FROM export_jobs) AS total_export_jobs;
