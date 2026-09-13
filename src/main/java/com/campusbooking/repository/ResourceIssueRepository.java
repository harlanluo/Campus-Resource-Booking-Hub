package com.campusbooking.repository;

import com.campusbooking.model.ResourceIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/** Spring Data repository for reported resource issues. */
@Repository
public interface ResourceIssueRepository extends JpaRepository<ResourceIssue, Long> {

    List<ResourceIssue> findAllByOrderByReportedTimeDesc();

    boolean existsByResourceIdAndStatusAndIdNot(
            Long resourceId, ResourceIssue.Status status, Long excludedIssueId);
}
