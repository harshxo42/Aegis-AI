"""initial schema

Revision ID: f59fea6940c0
Revises: 
Create Date: 2026-10-10 15:20:58.978674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f59fea6940c0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ----------------------------------------------------------------
    # ENUM VALUES: Python enums use lowercase string values.
    # (e.g. HospitalType.PRIVATE = "private")
    # PostgreSQL ENUM types must store those exact lowercase strings.
    # Table creation order follows the FK dependency graph.
    # Circular FK (departments <-> doctors) is resolved by creating
    # head_doctor_id as a plain column and adding the FK constraint
    # with op.create_foreign_key() only after the doctors table exists.
    # ----------------------------------------------------------------

    # 1. hospitals  (no foreign keys)
    op.create_table(
        'hospitals',
        sa.Column('name', sa.String(length=300), nullable=False),
        sa.Column('registration_number', sa.String(length=50), nullable=True),
        sa.Column('hospital_type',
                  sa.Enum('GOVERNMENT', 'PRIVATE', 'MILITARY', 'NGO',
                          name='hospitaltype'),
                  nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('established_year', sa.Integer(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=10), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('total_beds', sa.Integer(), nullable=False),
        sa.Column('available_beds', sa.Integer(), nullable=False),
        sa.Column('icu_beds', sa.Integer(), nullable=False),
        sa.Column('icu_available', sa.Integer(), nullable=False),
        sa.Column('ventilators', sa.Integer(), nullable=False),
        sa.Column('ventilators_available', sa.Integer(), nullable=False),
        sa.Column('has_emergency', sa.Boolean(), nullable=False),
        sa.Column('has_ambulance', sa.Boolean(), nullable=False),
        sa.Column('has_pharmacy', sa.Boolean(), nullable=False),
        sa.Column('has_lab', sa.Boolean(), nullable=False),
        sa.Column('has_blood_bank', sa.Boolean(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('total_reviews', sa.Integer(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_hospitals')),
        sa.UniqueConstraint('registration_number',
                            name=op.f('uq_hospitals_registration_number')),
    )
    op.create_index(op.f('ix_hospitals_city'), 'hospitals', ['city'], unique=False)
    op.create_index(op.f('ix_hospitals_name'), 'hospitals', ['name'], unique=False)

    # 2. users  (no foreign keys)
    op.create_table(
        'users',
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('role',
                  sa.Enum('PATIENT', 'DOCTOR', 'AMBULANCE_DRIVER',
                          'HOSPITAL_ADMIN', 'GOVERNMENT_ADMIN',
                          name='userrole'),
                  nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. ambulances  (FK -> hospitals, users)
    op.create_table(
        'ambulances',
        sa.Column('vehicle_number', sa.String(length=20), nullable=False),
        sa.Column('ambulance_type',
                  sa.Enum('BASIC', 'ADVANCED', 'ICU', 'NEONATAL',
                          name='ambulancetype'),
                  nullable=False),
        sa.Column('status',
                  sa.Enum('AVAILABLE', 'DISPATCHED', 'EN_ROUTE', 'AT_SCENE',
                          'TRANSPORTING', 'AT_HOSPITAL', 'RETURNING',
                          'OFFLINE', 'MAINTENANCE',
                          name='ambulancestatus'),
                  nullable=False),
        sa.Column('hospital_id', sa.String(length=36), nullable=True),
        sa.Column('driver_id', sa.String(length=36), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('last_location_update', sa.DateTime(timezone=True), nullable=True),
        sa.Column('has_oxygen', sa.Boolean(), nullable=False),
        sa.Column('has_defibrillator', sa.Boolean(), nullable=False),
        sa.Column('has_ventilator', sa.Boolean(), nullable=False),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'],
                                name=op.f('fk_ambulances_driver_id_users'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['hospital_id'], ['hospitals.id'],
                                name=op.f('fk_ambulances_hospital_id_hospitals'),
                                ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_ambulances')),
    )
    op.create_index(op.f('ix_ambulances_hospital_id'), 'ambulances', ['hospital_id'], unique=False)
    op.create_index(op.f('ix_ambulances_vehicle_number'), 'ambulances', ['vehicle_number'], unique=True)

    # 4. audit_logs  (FK -> users)
    op.create_table(
        'audit_logs',
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=True),
        sa.Column('resource_id', sa.String(length=36), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('method', sa.String(length=10), nullable=True),
        sa.Column('endpoint', sa.String(length=500), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_audit_logs_user_id_users'),
                                ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs')),
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # 5. notifications  (FK -> users)
    op.create_table(
        'notifications',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type',
                  sa.Enum('EMERGENCY', 'INFO', 'WARNING', 'SUCCESS', 'SYSTEM',
                          name='notificationtype'),
                  nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.Column('action_label', sa.String(length=100), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_notifications_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_notifications')),
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 6. patients  (FK -> users)
    op.create_table(
        'patients',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('blood_group', sa.String(length=5), nullable=True),
        sa.Column('date_of_birth', sa.String(length=10), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('chronic_conditions', sa.Text(), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=150), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_relation', sa.String(length=50), nullable=True),
        sa.Column('insurance_provider', sa.String(length=200), nullable=True),
        sa.Column('insurance_id', sa.String(length=100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('location_lat', sa.Float(), nullable=True),
        sa.Column('location_lng', sa.Float(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_patients_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_patients')),
    )
    op.create_index(op.f('ix_patients_user_id'), 'patients', ['user_id'], unique=True)

    # 7. departments  (FK -> hospitals only; FK to doctors is DEFERRED - see step 9)
    #    head_doctor_id is created as a plain column WITHOUT a FK constraint.
    op.create_table(
        'departments',
        sa.Column('hospital_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('floor', sa.Integer(), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('current_patients', sa.Integer(), nullable=False),
        sa.Column('head_doctor_id', sa.String(length=36), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['hospital_id'], ['hospitals.id'],
                                name=op.f('fk_departments_hospital_id_hospitals'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_departments')),
    )
    op.create_index(op.f('ix_departments_hospital_id'), 'departments', ['hospital_id'], unique=False)

    # 8. doctors  (FK -> users, hospitals, departments)
    op.create_table(
        'doctors',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('hospital_id', sa.String(length=36), nullable=True),
        sa.Column('department_id', sa.String(length=36), nullable=True),
        sa.Column('specialization', sa.String(length=200), nullable=False),
        sa.Column('license_number', sa.String(length=50), nullable=False),
        sa.Column('qualification', sa.String(length=300), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False),
        sa.Column('consultation_fee', sa.Float(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('total_patients', sa.Integer(), nullable=False),
        sa.Column('about', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'],
                                name=op.f('fk_doctors_department_id_departments'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['hospital_id'], ['hospitals.id'],
                                name=op.f('fk_doctors_hospital_id_hospitals'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name=op.f('fk_doctors_user_id_users'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_doctors')),
        sa.UniqueConstraint('license_number', name=op.f('uq_doctors_license_number')),
    )
    op.create_index(op.f('ix_doctors_department_id'), 'doctors', ['department_id'], unique=False)
    op.create_index(op.f('ix_doctors_hospital_id'), 'doctors', ['hospital_id'], unique=False)
    op.create_index(op.f('ix_doctors_user_id'), 'doctors', ['user_id'], unique=True)

    # 9. Deferred FK: departments.head_doctor_id -> doctors.id
    #    Added HERE, after both tables exist, to break the circular dependency.
    op.create_foreign_key(
        'fk_departments_head_doctor_id_doctors',
        'departments', 'doctors',
        ['head_doctor_id'], ['id'],
        ondelete='SET NULL',
    )

    # 10. emergency_requests  (FK -> patients, ambulances, hospitals)
    op.create_table(
        'emergency_requests',
        sa.Column('patient_id', sa.String(length=36), nullable=False),
        sa.Column('ambulance_id', sa.String(length=36), nullable=True),
        sa.Column('hospital_id', sa.String(length=36), nullable=True),
        sa.Column('emergency_type',
                  sa.Enum('CARDIAC', 'TRAUMA', 'STROKE', 'BREATHING', 'ACCIDENT',
                          'BURN', 'POISONING', 'PREGNANCY', 'MENTAL_HEALTH', 'OTHER',
                          name='emergencytype'),
                  nullable=False),
        sa.Column('severity', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('status',
                  sa.Enum('REQUESTED', 'ACKNOWLEDGED', 'DISPATCHED', 'EN_ROUTE',
                          'ARRIVED', 'IN_TREATMENT', 'TRANSPORTING', 'AT_HOSPITAL',
                          'RESOLVED', 'CANCELLED',
                          name='emergencystatus'),
                  nullable=False),
        sa.Column('location_lat', sa.Float(), nullable=False),
        sa.Column('location_lng', sa.Float(), nullable=False),
        sa.Column('location_address', sa.Text(), nullable=True),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('arrived_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ai_severity_score', sa.Float(), nullable=True),
        sa.Column('ai_recommended_hospital_id', sa.String(length=36), nullable=True),
        sa.Column('estimated_arrival_minutes', sa.Integer(), nullable=True),
        sa.Column('responder_notes', sa.Text(), nullable=True),
        sa.Column('hospital_notes', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['ambulance_id'], ['ambulances.id'],
                                name=op.f('fk_emergency_requests_ambulance_id_ambulances'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['hospital_id'], ['hospitals.id'],
                                name=op.f('fk_emergency_requests_hospital_id_hospitals'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'],
                                name=op.f('fk_emergency_requests_patient_id_patients'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_emergency_requests')),
    )
    op.create_index(op.f('ix_emergency_requests_patient_id'), 'emergency_requests', ['patient_id'], unique=False)

    # 11. predictions  (FK -> patients)
    op.create_table(
        'predictions',
        sa.Column('patient_id', sa.String(length=36), nullable=True),
        sa.Column('prediction_type',
                  sa.Enum('DISEASE', 'SEVERITY', 'HOSPITAL_RECOMMENDATION',
                          'WAITING_TIME', 'BED_OCCUPANCY',
                          name='predictiontype'),
                  nullable=False),
        sa.Column('input_data', sa.JSON(), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('result_summary', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('model_version', sa.String(length=20), nullable=True),
        sa.Column('is_accurate', sa.Boolean(), nullable=True),
        sa.Column('feedback_notes', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'],
                                name=op.f('fk_predictions_patient_id_patients'),
                                ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_predictions')),
    )
    op.create_index(op.f('ix_predictions_patient_id'), 'predictions', ['patient_id'], unique=False)

    # 12. medical_reports  (FK -> patients, doctors)
    op.create_table(
        'medical_reports',
        sa.Column('patient_id', sa.String(length=36), nullable=False),
        sa.Column('doctor_id', sa.String(length=36), nullable=True),
        sa.Column('file_name', sa.String(length=300), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('report_type', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=300), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('key_findings', sa.Text(), nullable=True),
        sa.Column('is_processed', sa.Boolean(), nullable=False),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'],
                                name=op.f('fk_medical_reports_doctor_id_doctors'),
                                ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'],
                                name=op.f('fk_medical_reports_patient_id_patients'),
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_medical_reports')),
    )
    op.create_index(op.f('ix_medical_reports_patient_id'), 'medical_reports', ['patient_id'], unique=False)


def downgrade() -> None:
    # Drop tables in strict reverse-dependency order
    op.drop_index(op.f('ix_medical_reports_patient_id'), table_name='medical_reports')
    op.drop_table('medical_reports')

    op.drop_index(op.f('ix_predictions_patient_id'), table_name='predictions')
    op.drop_table('predictions')

    op.drop_index(op.f('ix_emergency_requests_patient_id'), table_name='emergency_requests')
    op.drop_table('emergency_requests')

    # Drop the deferred FK before dropping doctors
    op.drop_constraint('fk_departments_head_doctor_id_doctors', 'departments', type_='foreignkey')

    op.drop_index(op.f('ix_doctors_user_id'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_hospital_id'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_department_id'), table_name='doctors')
    op.drop_table('doctors')

    op.drop_index(op.f('ix_patients_user_id'), table_name='patients')
    op.drop_table('patients')

    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index(op.f('ix_departments_hospital_id'), table_name='departments')
    op.drop_table('departments')

    op.drop_index(op.f('ix_ambulances_vehicle_number'), table_name='ambulances')
    op.drop_index(op.f('ix_ambulances_hospital_id'), table_name='ambulances')
    op.drop_table('ambulances')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_hospitals_name'), table_name='hospitals')
    op.drop_index(op.f('ix_hospitals_city'), table_name='hospitals')
    op.drop_table('hospitals')

    # Drop PostgreSQL ENUM types
    op.execute('DROP TYPE IF EXISTS predictiontype')
    op.execute('DROP TYPE IF EXISTS emergencystatus')
    op.execute('DROP TYPE IF EXISTS emergencytype')
    op.execute('DROP TYPE IF EXISTS notificationtype')
    op.execute('DROP TYPE IF EXISTS ambulancestatus')
    op.execute('DROP TYPE IF EXISTS ambulancetype')
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS hospitaltype')