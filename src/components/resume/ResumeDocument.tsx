'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { useResumeStore } from '@/store/resumeStore';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contact: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    borderBottom: '1px solid #ccc',
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  item: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#666',
  },
  itemDate: {
    fontSize: 10,
    color: '#666',
  },
  itemDescription: {
    fontSize: 10,
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    fontSize: 10,
    marginRight: 5,
  },
});

const ResumeDocument = () => {
  const { personalInfo, experience, education, skills, projects } = useResumeStore();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
          <Text style={styles.contact}>
            {personalInfo.email}
            {personalInfo.phone && ` | ${personalInfo.phone}`}
            {personalInfo.linkedin && ` | ${personalInfo.linkedin}`}
          </Text>
          {personalInfo.address && (
            <Text style={styles.contact}>{personalInfo.address}</Text>
          )}
        </View>

        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.itemDescription}>{personalInfo.summary}</Text>
          </View>
        )}

        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDate}>{exp.startDate} - {exp.endDate}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{exp.company} | {exp.location}</Text>
                {exp.description.map((desc, i) => (
                  <Text key={i} style={styles.itemDescription}>• {desc}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.major}</Text>
                  <Text style={styles.itemDate}>{edu.startDate} - {edu.endDate}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.university} | {edu.location}</Text>
                {edu.gpa && <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}

        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{proj.name}</Text>
                  <Text style={styles.itemDate}>{proj.startDate} - {proj.endDate}</Text>
                </View>
                {proj.description.map((desc, i) => (
                  <Text key={i} style={styles.itemDescription}>• {desc}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((group) => (
                <Text key={group.id} style={styles.skill}>
                  {group.name}: {group.skills.join(', ')}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumeDocument;
